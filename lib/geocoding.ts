interface LocationData {
  name: string
  latitude: number
  longitude: number
}

interface NominatimResult {
  place_id: number
  lat: string
  lon: string
  display_name: string
  class: string
  type: string
  importance: number
}

// Cache to avoid repeated API calls for the same location
const geocodeCache = new Map<string, LocationData>()

/**
 * Geocode a location string to get coordinates
 * Uses OpenStreetMap Nominatim API with caching
 */
export async function geocodeLocation(location: string): Promise<LocationData | null> {
  if (!location || location.trim().length === 0) {
    return null
  }

  const normalizedLocation = location.trim().toLowerCase()
  
  // Check cache first
  if (geocodeCache.has(normalizedLocation)) {
    return geocodeCache.get(normalizedLocation) || null
  }

  // Try estimated coordinates from common Camino locations first
  const estimatedCoords = getEstimatedCaminoCoordinates(location)
  if (estimatedCoords) {
    const locationData = {
      name: location,
      latitude: estimatedCoords[0],
      longitude: estimatedCoords[1]
    }
    geocodeCache.set(normalizedLocation, locationData)
    return locationData
  }

  // Fall back to Nominatim API
  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/search?` +
      `q=${encodeURIComponent(location)}&` +
      `format=json&` +
      `limit=1&` +
      `countrycodes=es,fr,pt&` +
      `addressdetails=1`,
      {
        headers: {
          'User-Agent': 'CaminoJournalApp/1.0'
        }
      }
    )

    if (response.ok) {
      const results: NominatimResult[] = await response.json()
      if (results.length > 0) {
        const result = results[0]
        const locationData = {
          name: location,
          latitude: parseFloat(result.lat),
          longitude: parseFloat(result.lon)
        }
        
        // Cache the result
        geocodeCache.set(normalizedLocation, locationData)
        return locationData
      }
    }
  } catch (error) {
    console.error('Geocoding error for location:', location, error)
  }

  return null
}

/**
 * Batch geocode multiple locations
 * Returns a map of location -> coordinates
 */
export async function geocodeMultipleLocations(locations: string[]): Promise<Map<string, LocationData>> {
  const results = new Map<string, LocationData>()
  
  // Process in batches to avoid overwhelming the API
  const batchSize = 5
  for (let i = 0; i < locations.length; i += batchSize) {
    const batch = locations.slice(i, i + batchSize)
    const promises = batch.map(async (location) => {
      const coords = await geocodeLocation(location)
      if (coords) {
        results.set(location, coords)
      }
      // Add small delay between requests to be respectful to the API
      await new Promise(resolve => setTimeout(resolve, 200))
    })
    
    await Promise.all(promises)
  }
  
  return results
}

/**
 * Helper function to get estimated coordinates for common Camino locations
 * This provides immediate results without API calls for known locations
 */
function getEstimatedCaminoCoordinates(location: string): [number, number] | null {
  const caminoLocations: Record<string, [number, number]> = {
    'saint-jean-pied-de-port': [43.1639, -1.2361],
    'roncesvalles': [43.0100, -1.3196],
    'pamplona': [42.8169, -1.6432],
    'puente la reina': [42.6719, -1.8158],
    'estella': [42.6719, -2.0269],
    'los arcos': [42.5633, -2.1864],
    'logroño': [42.4627, -2.4449],
    'nájera': [42.4167, -2.7333],
    'santo domingo de la calzada': [42.4389, -2.9522],
    'belorado': [42.4272, -3.1881],
    'san juan de ortega': [42.3978, -3.4103],
    'burgos': [42.3440, -3.6969],
    'castrojeriz': [42.2869, -4.1372],
    'frómista': [42.2631, -4.4003],
    'carrión de los condes': [42.3361, -4.6031],
    'sahagún': [42.3711, -2.8319],
    'león': [42.5987, -5.5671],
    'astorga': [42.4572, -6.0678],
    'ponferrada': [42.5500, -6.5833],
    'villafranca del bierzo': [42.6061, -6.8078],
    'o cebreiro': [42.7081, -7.0431],
    'sarria': [42.7767, -7.4161],
    'palas de rei': [42.8719, -7.8653],
    'melide': [42.9156, -8.0169],
    'arzúa': [42.9306, -8.1581],
    'santiago de compostela': [42.8805, -8.5456]
  }

  const normalizedLocation = location.toLowerCase().trim()

  // Try exact match first
  if (caminoLocations[normalizedLocation]) {
    return caminoLocations[normalizedLocation]
  }

  // Try partial matches
  for (const [key, coords] of Object.entries(caminoLocations)) {
    if (key.includes(normalizedLocation) || normalizedLocation.includes(key)) {
      return coords
    }
  }

  return null
}

/**
 * Clear the geocoding cache
 */
export function clearGeocodeCache(): void {
  geocodeCache.clear()
}