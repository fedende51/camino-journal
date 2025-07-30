import { GarminConnectService, ProcessedGarminData } from './garminConnect'
import { StravaConnectService, ProcessedStravaData } from './stravaConnect'

export interface UnifiedGPSData {
  source: 'garmin' | 'strava' | 'manual'
  activityId?: string
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
  externalUrl?: string
  coordinates?: Array<{
    lat: number
    lng: number
  }>
  rawData?: any
}

export interface ManualGPSInput {
  startLocation: string
  endLocation: string
  distanceKm: number
  elevationGainM?: number
  durationMinutes: number
  startTime?: Date
  calories?: number
  notes?: string
}

export class GPSDataProcessor {
  /**
   * Process GPS data from multiple sources with fallback priority
   */
  static async processGPSDataForDate(
    date: Date,
    userId: string,
    options: {
      garminCredentials?: { email: string; password: string }
      stravaAccessToken?: string
      preferredSource?: 'garmin' | 'strava'
    } = {}
  ): Promise<{ 
    gpsData?: UnifiedGPSData
    activities?: UnifiedGPSData[]
    error?: string 
    source?: 'garmin' | 'strava' | 'none'
  }> {
    const { garminCredentials, stravaAccessToken, preferredSource = 'strava' } = options
    
    const startOfDay = new Date(date)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(date)
    endOfDay.setHours(23, 59, 59, 999)

    // Try preferred source first
    if (preferredSource === 'strava' && stravaAccessToken) {
      const stravaResult = await this.getStravaDataForDate(stravaAccessToken, startOfDay, endOfDay)
      if (stravaResult.activities && stravaResult.activities.length > 0) {
        return {
          gpsData: stravaResult.activities[0], // Take the first/longest activity
          activities: stravaResult.activities,
          source: 'strava'
        }
      }
    }

    if (preferredSource === 'garmin' && garminCredentials) {
      const garminResult = await this.getGarminDataForDate(garminCredentials, startOfDay, endOfDay)
      if (garminResult.activities && garminResult.activities.length > 0) {
        return {
          gpsData: garminResult.activities[0],
          activities: garminResult.activities,
          source: 'garmin'
        }
      }
    }

    // Try fallback source
    if (preferredSource === 'garmin' && stravaAccessToken) {
      const stravaResult = await this.getStravaDataForDate(stravaAccessToken, startOfDay, endOfDay)
      if (stravaResult.activities && stravaResult.activities.length > 0) {
        return {
          gpsData: stravaResult.activities[0],
          activities: stravaResult.activities,
          source: 'strava'
        }
      }
    }

    if (preferredSource === 'strava' && garminCredentials) {
      const garminResult = await this.getGarminDataForDate(garminCredentials, startOfDay, endOfDay)
      if (garminResult.activities && garminResult.activities.length > 0) {
        return {
          gpsData: garminResult.activities[0],
          activities: garminResult.activities,
          source: 'garmin'
        }
      }
    }

    return {
      error: 'No GPS data found for the specified date',
      source: 'none'
    }
  }

  /**
   * Get Strava data for specific date
   */
  private static async getStravaDataForDate(
    accessToken: string,
    startDate: Date,
    endDate: Date
  ): Promise<{ activities?: UnifiedGPSData[]; error?: string }> {
    try {
      const { activities, error } = await StravaConnectService.getActivitiesForDateRange(
        accessToken,
        startDate,
        endDate,
        ['Walk', 'Hike', 'Run'] // Camino-relevant activities
      )

      if (error) {
        return { error }
      }

      const unifiedData = activities.map(activity => this.convertStravaToUnified(activity))
      
      // Sort by distance (longest first) for better main activity selection
      unifiedData.sort((a, b) => b.distanceKm - a.distanceKm)

      return { activities: unifiedData }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch Strava data'
      }
    }
  }

  /**
   * Get Garmin data for specific date
   */
  private static async getGarminDataForDate(
    credentials: { email: string; password: string },
    startDate: Date,
    endDate: Date
  ): Promise<{ activities?: UnifiedGPSData[]; error?: string }> {
    try {
      const { activities, error } = await GarminConnectService.getActivitiesByDateRange(
        startDate,
        endDate
      )

      if (error) {
        return { error }
      }

      const unifiedData = activities.map(activity => this.convertGarminToUnified(activity))
      
      // Sort by distance (longest first)
      unifiedData.sort((a, b) => b.distanceKm - a.distanceKm)

      return { activities: unifiedData }
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Failed to fetch Garmin data'
      }
    }
  }

  /**
   * Convert Strava data to unified format
   */
  private static convertStravaToUnified(data: ProcessedStravaData): UnifiedGPSData {
    return {
      source: 'strava',
      activityId: data.activityId,
      name: data.name,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      distanceKm: data.distanceKm,
      elevationGainM: data.elevationGainM,
      durationMinutes: data.durationMinutes,
      averageSpeedKmh: data.averageSpeedKmh,
      startTime: data.startTime,
      endTime: data.endTime,
      calories: data.calories,
      heartRateData: data.heartRateData,
      externalUrl: data.stravaUrl,
      coordinates: data.coordinates,
      rawData: data
    }
  }

  /**
   * Convert Garmin data to unified format
   */
  private static convertGarminToUnified(data: ProcessedGarminData): UnifiedGPSData {
    return {
      source: 'garmin',
      activityId: data.activityId,
      name: data.name,
      startLocation: data.startLocation,
      endLocation: data.endLocation,
      distanceKm: data.distanceKm,
      elevationGainM: data.elevationGainM,
      durationMinutes: data.durationMinutes,
      averageSpeedKmh: data.averageSpeedKmh,
      startTime: data.startTime,
      endTime: data.endTime,
      calories: data.calories,
      heartRateData: data.heartRateData,
      coordinates: data.coordinates,
      rawData: data
    }
  }

  /**
   * Create GPS data from manual input
   */
  static createManualGPSData(input: ManualGPSInput, date: Date): UnifiedGPSData {
    const startTime = input.startTime || new Date(date.setHours(8, 0, 0, 0)) // Default 8 AM start
    const endTime = new Date(startTime.getTime() + input.durationMinutes * 60000)
    
    return {
      source: 'manual',
      name: `Walking Day - ${input.startLocation} to ${input.endLocation}`,
      startLocation: input.startLocation,
      endLocation: input.endLocation,
      distanceKm: input.distanceKm,
      elevationGainM: input.elevationGainM || 0,
      durationMinutes: input.durationMinutes,
      averageSpeedKmh: Math.round((input.distanceKm / (input.durationMinutes / 60)) * 100) / 100,
      startTime,
      endTime,
      calories: input.calories,
      rawData: input
    }
  }

  /**
   * Validate GPS data before saving
   */
  static validateGPSData(data: UnifiedGPSData): { isValid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!data.startLocation || data.startLocation.trim() === '') {
      errors.push('Start location is required')
    }

    if (!data.endLocation || data.endLocation.trim() === '') {
      errors.push('End location is required')
    }

    if (data.distanceKm <= 0) {
      errors.push('Distance must be greater than 0')
    }

    if (data.distanceKm > 100) {
      errors.push('Distance seems unusually high (>100km). Please verify.')
    }

    if (data.durationMinutes <= 0) {
      errors.push('Duration must be greater than 0')
    }

    if (data.durationMinutes > 24 * 60) {
      errors.push('Duration cannot exceed 24 hours')
    }

    if (data.elevationGainM < 0) {
      errors.push('Elevation gain cannot be negative')
    }

    if (data.averageSpeedKmh > 15) {
      errors.push('Average speed seems too high for walking (>15 km/h). Please verify.')
    }

    return {
      isValid: errors.length === 0,
      errors
    }
  }

  /**
   * Calculate additional statistics
   */
  static calculateAdditionalStats(data: UnifiedGPSData): {
    paceMinPerKm: number
    estimatedCalories: number
    movingTimeHours: number
  } {
    const paceMinPerKm = data.durationMinutes / data.distanceKm
    
    // Rough calorie estimation for walking (70kg person)
    // Formula: 0.035 × body_weight + ((speed^2 / height) × 0.029 × body_weight)
    // Simplified for walking: ~50 calories per km + elevation factor
    const baseCalories = data.distanceKm * 50
    const elevationCalories = (data.elevationGainM / 100) * 10
    const estimatedCalories = Math.round(baseCalories + elevationCalories)

    const movingTimeHours = Math.round((data.durationMinutes / 60) * 100) / 100

    return {
      paceMinPerKm: Math.round(paceMinPerKm * 100) / 100,
      estimatedCalories: data.calories || estimatedCalories,
      movingTimeHours
    }
  }

  /**
   * Generate summary text for GPS data
   */
  static generateSummary(data: UnifiedGPSData): string {
    const stats = this.calculateAdditionalStats(data)
    
    let summary = `Walked ${data.distanceKm}km from ${data.startLocation} to ${data.endLocation}`
    
    if (data.elevationGainM > 0) {
      summary += ` with ${data.elevationGainM}m elevation gain`
    }
    
    summary += ` in ${stats.movingTimeHours} hours`
    
    if (stats.paceMinPerKm > 0) {
      const paceMinutes = Math.floor(stats.paceMinPerKm)
      const paceSeconds = Math.round((stats.paceMinPerKm - paceMinutes) * 60)
      summary += ` (${paceMinutes}:${paceSeconds.toString().padStart(2, '0')} min/km)`
    }
    
    if (data.source !== 'manual') {
      summary += `. Data from ${data.source === 'strava' ? 'Strava' : 'Garmin Connect'}.`
    }

    return summary
  }
}