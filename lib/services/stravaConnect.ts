export interface StravaActivity {
  id: number
  name: string
  distance: number // meters
  moving_time: number // seconds
  elapsed_time: number // seconds
  total_elevation_gain: number // meters
  type: string
  sport_type: string
  start_date: string
  start_date_local: string
  timezone: string
  start_latlng?: [number, number]
  end_latlng?: [number, number]
  location_city?: string
  location_state?: string
  location_country?: string
  achievement_count: number
  kudos_count: number
  comment_count: number
  athlete_count: number
  photo_count: number
  trainer: boolean
  commute: boolean
  manual: boolean
  private: boolean
  flagged: boolean
  gear_id?: string
  average_speed: number // m/s
  max_speed: number // m/s
  average_heartrate?: number
  max_heartrate?: number
  calories?: number
  suffer_score?: number
}

export interface StravaTokens {
  access_token: string
  refresh_token: string
  expires_at: number
}

export interface ProcessedStravaData {
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
  stravaUrl: string
  coordinates?: {
    lat: number
    lng: number
  }[]
}

export class StravaConnectService {
  private static readonly BASE_URL = 'https://www.strava.com/api/v3'
  private static readonly AUTH_URL = 'https://www.strava.com/oauth'
  
  /**
   * Generate Strava OAuth authorization URL
   */
  static getAuthorizationUrl(redirectUri: string, state?: string): string {
    const clientId = process.env.STRAVA_CLIENT_ID
    
    if (!clientId) {
      throw new Error('Strava Client ID not configured')
    }

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'read,activity:read',
      approval_prompt: 'auto'
    })

    if (state) {
      params.append('state', state)
    }

    return `${this.AUTH_URL}/authorize?${params.toString()}`
  }

  /**
   * Exchange authorization code for access tokens
   */
  static async exchangeCodeForTokens(code: string): Promise<{ tokens?: StravaTokens; error?: string }> {
    try {
      const clientId = process.env.STRAVA_CLIENT_ID
      const clientSecret = process.env.STRAVA_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        throw new Error('Strava API credentials not configured')
      }

      const response = await fetch(`${this.AUTH_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code'
        })
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}))
        throw new Error(errorData.message || 'Token exchange failed')
      }

      const data = await response.json()
      
      return {
        tokens: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at
        }
      }
    } catch (error) {
      console.error('Strava token exchange error:', error)
      return {
        error: error instanceof Error ? error.message : 'Token exchange failed'
      }
    }
  }

  /**
   * Refresh access token using refresh token
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ tokens?: StravaTokens; error?: string }> {
    try {
      const clientId = process.env.STRAVA_CLIENT_ID
      const clientSecret = process.env.STRAVA_CLIENT_SECRET

      if (!clientId || !clientSecret) {
        throw new Error('Strava API credentials not configured')
      }

      const response = await fetch(`${this.AUTH_URL}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          client_id: clientId,
          client_secret: clientSecret,
          refresh_token: refreshToken,
          grant_type: 'refresh_token'
        })
      })

      if (!response.ok) {
        throw new Error('Token refresh failed')
      }

      const data = await response.json()
      
      return {
        tokens: {
          access_token: data.access_token,
          refresh_token: data.refresh_token,
          expires_at: data.expires_at
        }
      }
    } catch (error) {
      console.error('Strava token refresh error:', error)
      return {
        error: error instanceof Error ? error.message : 'Token refresh failed'
      }
    }
  }

  /**
   * Get athlete's recent activities
   */
  static async getRecentActivities(
    accessToken: string, 
    limit: number = 30,
    after?: Date,
    before?: Date
  ): Promise<{ activities: StravaActivity[]; error?: string }> {
    try {
      const params = new URLSearchParams({
        per_page: limit.toString(),
        page: '1'
      })

      if (after) {
        params.append('after', Math.floor(after.getTime() / 1000).toString())
      }

      if (before) {
        params.append('before', Math.floor(before.getTime() / 1000).toString())
      }

      const response = await fetch(`${this.BASE_URL}/athlete/activities?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Access token expired or invalid')
        }
        throw new Error('Failed to fetch activities')
      }

      const activities = await response.json()
      
      return { activities }
    } catch (error) {
      console.error('Strava activities fetch error:', error)
      return {
        activities: [],
        error: error instanceof Error ? error.message : 'Failed to fetch activities'
      }
    }
  }

  /**
   * Get detailed activity information
   */
  static async getActivity(
    accessToken: string, 
    activityId: string
  ): Promise<{ activity?: StravaActivity; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/activities/${activityId}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Access token expired or invalid')
        }
        throw new Error('Failed to fetch activity')
      }

      const activity = await response.json()
      
      return { activity }
    } catch (error) {
      console.error('Strava activity fetch error:', error)
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch activity'
      }
    }
  }

  /**
   * Get activity route/GPS data
   */
  static async getActivityRoute(
    accessToken: string, 
    activityId: string
  ): Promise<{ coordinates?: Array<{lat: number, lng: number}>; error?: string }> {
    try {
      const response = await fetch(`${this.BASE_URL}/activities/${activityId}/streams?keys=latlng&key_by_type=true`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      })

      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Access token expired or invalid')
        }
        return { coordinates: [] } // No GPS data available
      }

      const streams = await response.json()
      
      if (streams.latlng && streams.latlng.data) {
        const coordinates = streams.latlng.data.map((point: [number, number]) => ({
          lat: point[0],
          lng: point[1]
        }))
        return { coordinates }
      }

      return { coordinates: [] }
    } catch (error) {
      console.error('Strava route fetch error:', error)
      return {
        coordinates: [],
        error: error instanceof Error ? error.message : 'Failed to fetch route data'
      }
    }
  }

  /**
   * Process raw Strava activity data into our format
   */
  static async processActivityData(
    activity: StravaActivity, 
    coordinates?: Array<{lat: number, lng: number}>
  ): Promise<ProcessedStravaData> {
    let startLocation = 'Unknown'
    let endLocation = 'Unknown'

    // Try to get location from activity metadata first
    if (activity.location_city && activity.location_state) {
      startLocation = `${activity.location_city}, ${activity.location_state}`
    }

    // Fallback to reverse geocoding if we have coordinates
    if (activity.start_latlng && startLocation === 'Unknown') {
      try {
        startLocation = await this.reverseGeocode(activity.start_latlng[0], activity.start_latlng[1])
      } catch (error) {
        console.error('Reverse geocoding failed:', error)
      }
    }

    if (activity.end_latlng && endLocation === 'Unknown') {
      try {
        endLocation = await this.reverseGeocode(activity.end_latlng[0], activity.end_latlng[1])
      } catch (error) {
        console.error('Reverse geocoding failed:', error)
      }
    }

    return {
      activityId: activity.id.toString(),
      name: activity.name || 'Unnamed Activity',
      startLocation,
      endLocation,
      distanceKm: Math.round((activity.distance || 0) / 1000 * 100) / 100,
      elevationGainM: Math.round(activity.total_elevation_gain || 0),
      durationMinutes: Math.round((activity.moving_time || 0) / 60),
      averageSpeedKmh: Math.round(((activity.average_speed || 0) * 3.6) * 100) / 100,
      startTime: new Date(activity.start_date),
      endTime: new Date(new Date(activity.start_date).getTime() + (activity.elapsed_time || 0) * 1000),
      calories: activity.calories,
      heartRateData: activity.average_heartrate ? {
        average: activity.average_heartrate,
        max: activity.max_heartrate || activity.average_heartrate
      } : undefined,
      stravaUrl: `https://www.strava.com/activities/${activity.id}`,
      coordinates
    }
  }

  /**
   * Search for activities by date range and activity type
   */
  static async getActivitiesForDateRange(
    accessToken: string,
    startDate: Date,
    endDate: Date,
    activityTypes: string[] = ['Walk', 'Hike', 'Run']
  ): Promise<{ activities: ProcessedStravaData[]; error?: string }> {
    try {
      const { activities, error } = await this.getRecentActivities(
        accessToken, 
        50, 
        startDate, 
        endDate
      )

      if (error) {
        return { activities: [], error }
      }

      // Filter by activity types (walking, hiking for Camino)
      const filteredActivities = activities
        .filter(activity => 
          activityTypes.some(type => 
            activity.type.toLowerCase().includes(type.toLowerCase()) ||
            activity.sport_type.toLowerCase().includes(type.toLowerCase())
          )
        )

      const processedActivities = await Promise.all(
        filteredActivities.map(activity => this.processActivityData(activity))
      )

      return { activities: processedActivities }
    } catch (error) {
      return {
        activities: [],
        error: error instanceof Error ? error.message : 'Failed to fetch activities by date range'
      }
    }
  }

  /**
   * Reverse geocoding helper
   */
  private static async reverseGeocode(lat: number, lng: number): Promise<string> {
    try {
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