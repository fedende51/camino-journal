export interface GarminActivity {
  activityId: number
  activityName: string
  description?: string
  startTimeLocal: string
  startTimeGMT: string
  activityType: {
    typeId: number
    typeKey: string
    parentTypeId: number
    sortOrder: number
  }
  distance?: number // meters
  duration?: number // seconds
  elapsedDuration?: number // seconds
  movingDuration?: number // seconds
  elevationGain?: number // meters
  elevationLoss?: number // meters
  averageSpeed?: number // m/s
  maxSpeed?: number // m/s
  calories?: number
  averageHR?: number
  maxHR?: number
  startLatitude?: number
  startLongitude?: number
  endLatitude?: number
  endLongitude?: number
  hasPolyline?: boolean
  ownerId?: number
  ownerDisplayName?: string
  ownerFullName?: string
  ownerProfileImageUrlSmall?: string
  ownerProfileImageUrlMedium?: string
  ownerProfileImageUrlLarge?: string
}

export interface GarminCredentials {
  email: string
  password: string
}

export interface ProcessedGarminData {
  activityId: string
  name: string
  startLocation: string
  endLocation: string
  distanceKm: number
  elevationGainM: number
  durationMinutes: number
  averageSpeedKmh: number
  startTime: Date
  endTime: Date
  calories?: number
  heartRateData?: {
    average: number
    max: number
  }
  coordinates?: {
    lat: number
    lng: number
  }[]
}

export class GarminConnectService {
  private static readonly BASE_URL = 'https://connect.garmin.com'
  private static readonly SSO_URL = 'https://sso.garmin.com/sso'
  
  /**
   * Authenticate with Garmin Connect
   * Note: This is a simplified implementation. In production, you'd need to handle
   * OAuth flow properly and store tokens securely.
   */
  static async authenticate(credentials: GarminCredentials): Promise<{ success: boolean; error?: string }> {
    try {
      // This is a placeholder implementation
      // In reality, Garmin Connect uses OAuth 2.0 and requires proper token management
      console.warn('Garmin Connect authentication requires OAuth 2.0 implementation')
      
      if (!process.env.GARMIN_CONSUMER_KEY || !process.env.GARMIN_CONSUMER_SECRET) {
        throw new Error('Garmin Connect API credentials not configured')
      }

      // Placeholder for OAuth flow
      return {
        success: false,
        error: 'Garmin Connect OAuth implementation required - using fallback manual entry'
      }
    } catch (error) {
      console.error('Garmin authentication error:', error)
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Authentication failed'
      }
    }
  }

  /**
   * Fetch recent activities from Garmin Connect
   */
  static async getRecentActivities(
    limit: number = 20,
    startDate?: Date
  ): Promise<{ activities: GarminActivity[]; error?: string }> {
    try {
      // This would require authenticated session
      console.warn('Garmin Connect API requires authenticated session')
      
      // Placeholder implementation
      return {
        activities: [],
        error: 'Garmin Connect API not available - using manual entry fallback'
      }
    } catch (error) {
      console.error('Garmin activities fetch error:', error)
      return {
        activities: [],
        error: error instanceof Error ? error.message : 'Failed to fetch activities'
      }
    }
  }

  /**
   * Get specific activity details
   */
  static async getActivity(activityId: string): Promise<{ activity?: GarminActivity; error?: string }> {
    try {
      // Placeholder for API call
      return {
        error: 'Garmin Connect API not available - using manual entry fallback'
      }
    } catch (error) {
      console.error('Garmin activity fetch error:', error)
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch activity'
      }
    }
  }

  /**
   * Process raw Garmin activity data into our format
   */
  static processActivityData(activity: GarminActivity): ProcessedGarminData {
    return {
      activityId: activity.activityId.toString(),
      name: activity.activityName || 'Unnamed Activity',
      startLocation: 'Unknown', // Would extract from coordinates
      endLocation: 'Unknown', // Would extract from coordinates  
      distanceKm: Math.round((activity.distance || 0) / 1000 * 100) / 100,
      elevationGainM: Math.round(activity.elevationGain || 0),
      durationMinutes: Math.round((activity.duration || 0) / 60),
      averageSpeedKmh: Math.round(((activity.averageSpeed || 0) * 3.6) * 100) / 100,
      startTime: new Date(activity.startTimeLocal),
      endTime: new Date(new Date(activity.startTimeLocal).getTime() + (activity.duration || 0) * 1000),
      calories: activity.calories,
      heartRateData: activity.averageHR ? {
        average: activity.averageHR,
        max: activity.maxHR || activity.averageHR
      } : undefined,
      coordinates: activity.hasPolyline ? [] : undefined // Would parse polyline data
    }
  }

  /**
   * Search for activities by date range
   */
  static async getActivitiesByDateRange(
    startDate: Date,
    endDate: Date
  ): Promise<{ activities: ProcessedGarminData[]; error?: string }> {
    try {
      const { activities, error } = await this.getRecentActivities(50, startDate)
      
      if (error) {
        return { activities: [], error }
      }

      const filteredActivities = activities
        .filter(activity => {
          const activityDate = new Date(activity.startTimeLocal)
          return activityDate >= startDate && activityDate <= endDate
        })
        .map(activity => this.processActivityData(activity))

      return { activities: filteredActivities }
    } catch (error) {
      return {
        activities: [],
        error: error instanceof Error ? error.message : 'Failed to fetch activities by date range'
      }
    }
  }

  /**
   * Convert location coordinates to place names (reverse geocoding)
   */
  static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
      // Using a simple reverse geocoding approach
      // In production, you'd use Google Maps API or similar
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`
      )
      
      if (!response.ok) {
        throw new Error('Reverse geocoding failed')
      }
      
      const data = await response.json()
      return data.locality || data.city || data.principalSubdivision || 'Unknown Location'
    } catch (error) {
      console.error('Reverse geocoding error:', error)
      return 'Unknown Location'
    }
  }
}