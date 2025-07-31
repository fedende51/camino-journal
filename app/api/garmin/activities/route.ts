import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { decryptPassword } from '@/lib/utils/encryption'

interface GarminActivityRequest {
  email?: string
  password?: string
  days?: number
}

interface ProcessedActivity {
  activityId: string
  name: string
  activityType: string
  date: string
  startLocation: string
  endLocation: string
  distanceKm: number
  elevationGainM: number
  durationMinutes: number
  averageSpeedKmh: number
  startTime: string
  endTime: string
  calories?: number
  heartRateData?: {
    average: number
    max: number
  }
}

// Activity type mapping constants
const ACTIVITY_TYPE_MAPPING: Record<string, string> = {
  'walking': 'Walking',
  'hiking': 'Hiking', 
  'running': 'Running',
  'cycling': 'Cycling',
  'trekking': 'Trekking',
  'trail_running': 'Trail Running',
  'road_biking': 'Road Cycling',
  'mountain_biking': 'Mountain Biking',
  'fitness_walking': 'Fitness Walking',
  'cardio': 'Cardio',
  'cardiovascular': 'Cardio',
  'strength': 'Strength Training',
  'training': 'Training',
  'workout': 'Workout',
  'exercise': 'Exercise'
}

const getActivityTypeDisplay = (activity: any): string => {
  const activityType = activity.activityType || {}
  const typeKey = (activityType.typeKey || '').toLowerCase()
  const typeName = (activityType.typeDisplayName || '').toLowerCase()
  const activityName = (activity.activityName || '').toLowerCase()
  
  // Check exact type key matches first
  if (ACTIVITY_TYPE_MAPPING[typeKey]) {
    return ACTIVITY_TYPE_MAPPING[typeKey]
  }
  
  // Check for keywords in type key, name, or activity name
  for (const [keyword, displayName] of Object.entries(ACTIVITY_TYPE_MAPPING)) {
    const keywordClean = keyword.replace('_', ' ')
    if (typeKey.includes(keywordClean) || typeName.includes(keywordClean) || activityName.includes(keywordClean)) {
      return displayName
    }
  }
  
  return activityType.typeDisplayName || 'Other Activity'
}

// Relevant activity keywords for journal entries
const RELEVANT_KEYWORDS = [
  'walk', 'walking', 'hike', 'hiking', 'trekking', 'trek',
  'run', 'running', 'jog', 'jogging', 'cycle', 'cycling', 'bike', 'biking',
  'pedestrian', 'foot', 'trail', 'ramble', 'stroll', 'fitness',
  'cardio', 'cardiovascular', 'aerobic', 'exercise', 'workout',
  'elliptical', 'treadmill', 'indoor', 'gym', 'strength', 'training'
]

const isRelevantActivity = (activity: any): boolean => {
  const activityType = activity.activityType || {}
  const typeKey = (activityType.typeKey || '').toLowerCase()
  const typeName = (activityType.typeDisplayName || '').toLowerCase()
  const activityName = (activity.activityName || '').toLowerCase()
  
  return RELEVANT_KEYWORDS.some(keyword => 
    typeKey.includes(keyword) || typeName.includes(keyword) || activityName.includes(keyword)
  )
}

// Simple location fallback - coordinates as location
const getLocationName = (lat?: number, lng?: number): string => 
  lat && lng ? `${lat.toFixed(4)}, ${lng.toFixed(4)}` : 'Unknown Location'

// Process raw Garmin activity data
const processActivity = (activity: any): ProcessedActivity => {
  const activityId = String(activity.activityId || '')
  const name = activity.activityName || 'Unnamed Activity'
  const distanceMeters = activity.distance || 0
  const durationSeconds = activity.duration || 0
  const elevationGain = activity.elevationGain || 0
  const startTimeLocal = activity.startTimeLocal || ''
  
  // Calculate derived values
  const distanceKm = Math.round((distanceMeters / 1000) * 100) / 100
  const durationMinutes = Math.round(durationSeconds / 60)
  const elevationGainM = Math.round(elevationGain)
  const averageSpeedKmh = distanceMeters && durationSeconds 
    ? Math.round((distanceMeters / durationSeconds) * 3.6 * 100) / 100 
    : 0
  
  // Parse timestamps
  let startTime = startTimeLocal
  let endTime = startTimeLocal
  let date = ''
  
  if (startTimeLocal && durationSeconds) {
    try {
      const startDate = new Date(startTimeLocal)
      const endDate = new Date(startDate.getTime() + durationSeconds * 1000)
      startTime = startDate.toISOString()
      endTime = endDate.toISOString()
      date = startDate.toISOString().split('T')[0]
    } catch (error) {
      console.error('Error parsing date:', error)
    }
  }
  
  return {
    activityId,
    name,
    activityType: getActivityTypeDisplay(activity),
    date,
    startLocation: getLocationName(activity.startLatitude, activity.startLongitude),
    endLocation: getLocationName(activity.endLatitude, activity.endLongitude),
    distanceKm,
    elevationGainM,
    durationMinutes,
    averageSpeedKmh,
    startTime,
    endTime,
    calories: activity.calories,
    heartRateData: activity.averageHR ? {
      average: activity.averageHR,
      max: activity.maxHR || activity.averageHR
    } : undefined
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const { email: providedEmail, password: providedPassword, days = 30 }: GarminActivityRequest = await request.json()

    // Get credentials - either from request or from stored user credentials
    let email = providedEmail
    let password = providedPassword

    if (!email || !password) {
      // Try to get stored credentials
      const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { garminEmail: true, garminPasswordHash: true }
      })

      if (!user?.garminEmail || !user?.garminPasswordHash) {
        return NextResponse.json(
          { success: false, error: 'No Garmin credentials found. Please provide credentials or connect your account first.' },
          { status: 400 }
        )
      }

      email = user.garminEmail
      password = decryptPassword(user.garminPasswordHash) // Decrypt the stored password
    }

    // Validate days parameter
    if (days && (days < 1 || days > 90)) {
      return NextResponse.json(
        { success: false, error: 'Days parameter must be between 1 and 90' },
        { status: 400 }
      )
    }

    console.log(`Fetching Garmin activities for last ${days} days...`)

    try {
      // Dynamic import to avoid build issues
      const { GarminConnect } = await import('garmin-connect')
      
      // Create Garmin Connect client
      const client = new GarminConnect({
        username: email,
        password: password
      })

      // Login to Garmin Connect
      await client.login()
      console.log('Successfully logged into Garmin Connect')

      // Calculate date range
      const endDate = new Date()
      const startDate = new Date()
      startDate.setDate(endDate.getDate() - days)

      const startDateStr = startDate.toISOString().split('T')[0]
      const endDateStr = endDate.toISOString().split('T')[0]

      console.log(`Fetching activities from ${startDateStr} to ${endDateStr}...`)

      // Get activities for the date range
      // The library might expect different parameters, let's try with limit and offset
      const activities = await client.getActivities(0, days * 10) // Get more activities than days to ensure coverage
      
      console.log(`Found ${activities?.length || 0} total activities`)

      if (!activities || activities.length === 0) {
        return NextResponse.json({
          success: true,
          activities: [],
          dateRange: {
            start: startDateStr,
            end: endDateStr
          }
        })
      }

      // Filter for relevant activities within date range and process them
      const relevantActivities: ProcessedActivity[] = []
      for (const activity of activities) {
        // Check if activity is within our date range
        const activityDate = new Date(activity.startTimeLocal || activity.startTimeGMT)
        if (activityDate >= startDate && activityDate <= endDate && isRelevantActivity(activity)) {
          const processedActivity = processActivity(activity)
          relevantActivities.push(processedActivity)
        }
      }

      // Sort activities by date (most recent first)
      relevantActivities.sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())

      console.log(`Found ${relevantActivities.length} relevant activities`)

      return NextResponse.json({
        success: true,
        activities: relevantActivities,
        dateRange: {
          start: startDateStr,
          end: endDateStr
        }
      })

    } catch (garminError: any) {
      console.error('Garmin Connect error:', garminError)
      
      // Handle common authentication errors
      const errorMessage = garminError.message || String(garminError)
      if (errorMessage.includes('401') || errorMessage.includes('authentication') || errorMessage.includes('login')) {
        return NextResponse.json(
          { success: false, error: 'Invalid Garmin Connect credentials. Please check your email and password.' },
          { status: 400 }
        )
      } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
        return NextResponse.json(
          { success: false, error: 'Unable to connect to Garmin Connect. Please check your internet connection.' },
          { status: 500 }
        )
      } else {
        return NextResponse.json(
          { success: false, error: `Error fetching activities: ${errorMessage}` },
          { status: 500 }
        )
      }
    }

  } catch (error) {
    console.error('Garmin API route error:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: error instanceof Error ? error.message : 'Internal server error' 
      },
      { status: 500 }
    )
  }
}