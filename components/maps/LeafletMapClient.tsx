'use client'

import { useEffect, useRef } from 'react'
import L from 'leaflet'

// Fix for default markers in Next.js
if (typeof window !== 'undefined') {
  delete (L.Icon.Default.prototype as any)._getIconUrl
  L.Icon.Default.mergeOptions({
    iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png',
    iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
  })
}

interface Entry {
  id: string
  dayNumber: number
  date: Date
  location: string
  title?: string | null
  content: string
  photos: any[]
  gpsData?: {
    id: string
    startLocation: string
    endLocation: string
    distanceKm?: number | null
    elevationGainM?: number | null
    durationMinutes?: number | null
    coordinates?: string // JSON string of coordinates
  } | null
}

interface LeafletMapClientProps {
  entries: Entry[]
}

export default function LeafletMapClient({ entries }: LeafletMapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || typeof window === 'undefined') return

    // Initialize map centered on Spain (Camino region)
    const map = L.map(mapRef.current, {
      zoomControl: true,
      scrollWheelZoom: true,
      doubleClickZoom: true,
      boxZoom: true,
      keyboard: true,
      dragging: true,
      touchZoom: true
    }).setView([42.8, -2.5], 7)
    
    mapInstanceRef.current = map

    // Add OpenStreetMap tiles with improved configuration
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      crossOrigin: true
    }).addTo(map)

    // Force map to invalidate its size after tiles start loading
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    // Filter entries that have GPS data
    const entriesWithGPS = entries.filter(entry => entry.gpsData)

    if (entriesWithGPS.length === 0) {
      // Show message if no GPS data
      const noDataMarker = L.marker([42.8, -2.5]).addTo(map)
      noDataMarker.bindPopup(`
        <div class="text-center p-2">
          <p class="text-gray-600 text-sm mb-2">📍 No GPS data available</p>
          <p class="text-gray-500 text-xs">Entries with location data will appear as pins on this map</p>
        </div>
      `).openPopup()
      return
    }

    // Create markers for each entry with GPS data
    const markers: L.Marker[] = []
    const coordinates: [number, number][] = []

    entriesWithGPS.forEach((entry, index) => {
      // For now, we'll use the location name to estimate coordinates
      // In a real app, you'd geocode the location or store actual coordinates
      const coords = getEstimatedCoordinates(entry.location, index)
      
      if (coords) {
        coordinates.push(coords)
        
        // Create custom marker
        const marker = L.marker(coords).addTo(map)
        
        // Create popup content
        const popupContent = `
          <div class="p-2 min-w-[200px]">
            <div class="flex items-center mb-2">
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                Day ${entry.dayNumber}
              </span>
            </div>
            <h3 class="font-semibold text-gray-900 mb-1">
              ${entry.location}
            </h3>
            ${entry.title ? `<p class="text-gray-700 text-sm mb-2">${entry.title}</p>` : ''}
            <p class="text-gray-600 text-xs mb-2">
              ${entry.date.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            ${entry.gpsData?.distanceKm ? `
              <div class="text-xs text-gray-500 mb-2">
                📏 ${entry.gpsData.distanceKm} km
                ${entry.gpsData.elevationGainM ? `• ⛰️ ${entry.gpsData.elevationGainM}m` : ''}
              </div>
            ` : ''}
            <p class="text-gray-700 text-sm mb-3 line-clamp-3">
              ${entry.content.substring(0, 120)}${entry.content.length > 120 ? '...' : ''}
            </p>
            ${entry.photos.length > 0 ? `
              <div class="mb-3">
                <img src="${entry.photos[0].blobUrl}" alt="Entry photo" 
                     class="w-full h-20 object-cover rounded" />
              </div>
            ` : ''}
            <a href="/entry/${entry.id}" 
               class="inline-block bg-blue-600 text-white px-3 py-1 rounded text-xs hover:bg-blue-700 transition-colors">
              Read full entry →
            </a>
          </div>
        `
        
        marker.bindPopup(popupContent, { maxWidth: 250 })
        markers.push(marker)
      }
    })

    // Draw journey path if we have multiple points
    if (coordinates.length > 1) {
      const polyline = L.polyline(coordinates, { 
        color: '#2563eb', 
        weight: 3, 
        opacity: 0.7 
      }).addTo(map)
      
      // Fit map to show all markers
      if (markers.length > 0) {
        const group = L.featureGroup(markers)
        map.fitBounds(group.getBounds().pad(0.1))
      }
    } else if (coordinates.length === 1) {
      // Center on single marker
      map.setView(coordinates[0], 10)
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [entries])

  return (
    <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}

// Helper function to estimate coordinates based on common Camino locations
// In a real app, you'd use proper geocoding or store actual coordinates
function getEstimatedCoordinates(location: string, index: number): [number, number] | null {
  const caminoLocations: Record<string, [number, number]> = {
    'Saint-Jean-Pied-de-Port': [43.1639, -1.2361],
    'Roncesvalles': [43.0100, -1.3196],
    'Pamplona': [42.8169, -1.6432],
    'Puente la Reina': [42.6719, -1.8158],
    'Estella': [42.6719, -2.0269],
    'Los Arcos': [42.5633, -2.1864],
    'Logroño': [42.4627, -2.4449],
    'Nájera': [42.4167, -2.7333],
    'Santo Domingo de la Calzada': [42.4389, -2.9522],
    'Belorado': [42.4272, -3.1881],
    'San Juan de Ortega': [42.3978, -3.4103],
    'Burgos': [42.3440, -3.6969],
    'Castrojeriz': [42.2869, -4.1372],
    'Frómista': [42.2631, -4.4003],
    'Carrión de los Condes': [42.3361, -4.6031],
    'Sahagún': [42.3711, -2.8319],
    'León': [42.5987, -5.5671],
    'Astorga': [42.4572, -6.0678],
    'Ponferrada': [42.5500, -6.5833],
    'Villafranca del Bierzo': [42.6061, -6.8078],
    'O Cebreiro': [42.7081, -7.0431],
    'Sarria': [42.7767, -7.4161],
    'Palas de Rei': [42.8719, -7.8653],
    'Melide': [42.9156, -8.0169],
    'Arzúa': [42.9306, -8.1581],
    'Santiago de Compostela': [42.8805, -8.5456]
  }

  // Try exact match first
  const exactMatch = caminoLocations[location]
  if (exactMatch) return exactMatch

  // Try partial match
  for (const [key, coords] of Object.entries(caminoLocations)) {
    if (key.toLowerCase().includes(location.toLowerCase()) || 
        location.toLowerCase().includes(key.toLowerCase())) {
      return coords
    }
  }

  // Fallback: create approximate coordinates along the Camino route
  const baseLat = 42.8
  const baseLng = -1.2
  const latStep = -0.05 * index
  const lngStep = -0.3 * index
  
  return [baseLat + latStep, baseLng + lngStep]
}