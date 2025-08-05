/**
 * Utility functions for calculating distances between geographic coordinates
 */

export interface Coordinates {
  latitude: number
  longitude: number
}

/**
 * Calculate the distance between two points on Earth using the Haversine formula
 * @param start Starting coordinates
 * @param end Ending coordinates
 * @returns Distance in kilometers (rounded to 1 decimal place)
 */
export function calculateDistance(start: Coordinates, end: Coordinates): number {
  const R = 6371 // Earth's radius in kilometers
  
  // Convert degrees to radians
  const lat1Rad = (start.latitude * Math.PI) / 180
  const lat2Rad = (end.latitude * Math.PI) / 180
  const deltaLatRad = ((end.latitude - start.latitude) * Math.PI) / 180
  const deltaLonRad = ((end.longitude - start.longitude) * Math.PI) / 180

  // Haversine formula
  const a = 
    Math.sin(deltaLatRad / 2) * Math.sin(deltaLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) *
    Math.sin(deltaLonRad / 2) * Math.sin(deltaLonRad / 2)
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  const distance = R * c

  // Round to 1 decimal place
  return Math.round(distance * 10) / 10
}

/**
 * Validate that coordinates are within valid ranges
 * @param coordinates Coordinates to validate
 * @returns True if coordinates are valid
 */
export function validateCoordinates(coordinates: Coordinates): boolean {
  const { latitude, longitude } = coordinates
  
  return (
    latitude >= -90 && latitude <= 90 &&
    longitude >= -180 && longitude <= 180 &&
    !isNaN(latitude) && !isNaN(longitude)
  )
}

/**
 * Check if coordinates represent a meaningful location (not 0,0)
 * @param coordinates Coordinates to check
 * @returns True if coordinates are meaningful
 */
export function hasMeaningfulCoordinates(coordinates: Coordinates): boolean {
  return validateCoordinates(coordinates) && !(coordinates.latitude === 0 && coordinates.longitude === 0)
}