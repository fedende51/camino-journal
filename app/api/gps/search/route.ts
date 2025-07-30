import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { GPSDataProcessor } from '@/lib/services/gpsDataProcessor'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const { date, source, stravaAccessToken, garminCredentials } = await request.json()
    
    if (!date) {
      return NextResponse.json(
        { error: 'Date is required' },
        { status: 400 }
      )
    }

    const searchDate = new Date(date)
    
    // Validate date
    if (isNaN(searchDate.getTime())) {
      return NextResponse.json(
        { error: 'Invalid date format' },
        { status: 400 }
      )
    }

    const result = await GPSDataProcessor.processGPSDataForDate(
      searchDate,
      session.user.id,
      {
        stravaAccessToken,
        garminCredentials,
        preferredSource: source || 'strava'
      }
    )

    if (result.error && result.source === 'none') {
      return NextResponse.json({
        message: 'No GPS data found for this date',
        suggestions: [
          'Check if you recorded a walking/hiking activity on this date',
          'Verify your Strava/Garmin account has activities for this date',
          'Consider adding GPS data manually if you walked without recording'
        ],
        fallbackOptions: {
          manualEntry: true,
          supportedSources: ['strava', 'garmin', 'manual']
        }
      }, { status: 200 })
    }

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      )
    }

    // Add validation and additional stats
    if (result.gpsData) {
      const validation = GPSDataProcessor.validateGPSData(result.gpsData)
      const additionalStats = GPSDataProcessor.calculateAdditionalStats(result.gpsData)
      const summary = GPSDataProcessor.generateSummary(result.gpsData)

      return NextResponse.json({
        gpsData: result.gpsData,
        activities: result.activities,
        source: result.source,
        validation,
        additionalStats,
        summary
      })
    }

    return NextResponse.json({
      message: 'No GPS data found',
      source: result.source
    })

  } catch (error) {
    console.error('GPS search error:', error)
    return NextResponse.json(
      { error: 'Failed to search GPS data' },
      { status: 500 }
    )
  }
}