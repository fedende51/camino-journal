'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
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
  date: string
  location: string
  latitude?: number
  longitude?: number
  title?: string
  content: string
  isPrivate: boolean
  isDraft: boolean
  photos: Array<{
    id: string
    blobUrl: string
    filename: string
    isHero: boolean
  }>
}

interface DashboardMapClientProps {
  entries: Entry[]
}

export default function DashboardMapClient({ entries }: DashboardMapClientProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstanceRef = useRef<L.Map | null>(null)
  const router = useRouter()

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

    // Add OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
      subdomains: ['a', 'b', 'c'],
      crossOrigin: true
    }).addTo(map)

    // Force map to invalidate its size after tiles start loading
    setTimeout(() => {
      map.invalidateSize()
    }, 100)

    // Filter entries that have coordinates
    const entriesWithCoords = entries.filter(entry => 
      entry.latitude && entry.longitude
    )

    if (entriesWithCoords.length === 0) {
      // Show message if no location data
      const noDataPopup = L.popup()
        .setLatLng([42.8, -2.5])
        .setContent(`
          <div class="text-center p-3 max-w-xs">
            <div class="text-2xl mb-2">🗺️</div>
            <p class="text-gray-600 text-sm mb-2 font-medium">No pinned locations yet</p>
            <p class="text-gray-500 text-xs leading-relaxed">
              As you create journal entries with specific locations (like "Santiago de Compostela" or "Pamplona"), 
              they'll appear as pins on this map showing your Camino progress.
            </p>
          </div>
        `)
        .openOn(map)
      return
    }

    // Create custom icon for entry pins
    const createCustomIcon = (dayNumber: number, isDraft: boolean, isPrivate: boolean) => {
      const color = isDraft ? '#f59e0b' : isPrivate ? '#6b7280' : '#2563eb'
      const bgColor = isDraft ? '#fef3c7' : isPrivate ? '#f3f4f6' : '#dbeafe'
      
      return L.divIcon({
        html: `
          <div style="
            background-color: ${bgColor};
            border: 2px solid ${color};
            border-radius: 50%;
            width: 32px;
            height: 32px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            font-size: 12px;
            color: ${color};
            box-shadow: 0 2px 4px rgba(0,0,0,0.2);
            cursor: pointer;
          ">
            ${dayNumber}
          </div>
        `,
        className: 'custom-day-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 16],
        popupAnchor: [0, -16]
      })
    }

    // Create markers for each entry with coordinates
    const markers: L.Marker[] = []
    const coordinates: [number, number][] = []

    // Sort entries by day number for proper route visualization
    const sortedEntries = [...entriesWithCoords].sort((a, b) => a.dayNumber - b.dayNumber)

    sortedEntries.forEach((entry) => {
      if (entry.latitude && entry.longitude) {
        const coords: [number, number] = [entry.latitude, entry.longitude]
        coordinates.push(coords)
        
        // Create custom marker with day number
        const customIcon = createCustomIcon(entry.dayNumber, entry.isDraft, entry.isPrivate)
        const marker = L.marker(coords, { icon: customIcon }).addTo(map)
        
        // Get hero photo for popup
        const heroPhoto = entry.photos.find(photo => photo.isHero) || entry.photos[0]
        
        // Create popup content - mobile optimized
        const popupContent = `
          <div class="p-3 min-w-[200px] max-w-[280px] text-sm">
            <div class="flex items-center justify-between mb-2">
              <span class="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-medium">
                Day ${entry.dayNumber}
              </span>
              <div class="flex gap-1">
                ${entry.isDraft ? '<span class="px-1.5 py-0.5 rounded text-xs bg-yellow-100 text-yellow-800">Draft</span>' : ''}
                <span class="px-1.5 py-0.5 rounded text-xs ${
                  entry.isPrivate ? 'bg-gray-100 text-gray-800' : 'bg-green-100 text-green-800'
                }">
                  ${entry.isPrivate ? 'Private' : 'Public'}
                </span>
              </div>
            </div>
            
            <h3 class="font-semibold text-gray-900 mb-1 text-sm">
              📍 ${entry.location}
            </h3>
            
            ${entry.title ? `<p class="text-gray-700 text-sm mb-2 font-medium">${entry.title}</p>` : ''}
            
            <p class="text-gray-600 text-xs mb-2">
              ${new Date(entry.date).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              })}
            </p>
            
            ${heroPhoto ? `
              <div class="mb-2">
                <img src="${heroPhoto.blobUrl}" alt="Entry photo" 
                     class="w-full h-20 object-cover rounded-md" />
              </div>
            ` : ''}
            
            <p class="text-gray-700 text-xs mb-3 leading-relaxed">
              ${entry.content.length > 100 
                ? `${entry.content.substring(0, 100)}...` 
                : entry.content
              }
            </p>
            
            <div class="flex gap-2">
              <button onclick="window.location.href='/pilgrim/edit/${entry.id}'" 
                      class="flex-1 bg-blue-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-blue-700 transition-colors">
                ✏️ Edit
              </button>
              <button onclick="window.location.href='/entry/${entry.id}'" 
                      class="flex-1 bg-green-600 text-white px-2 py-1.5 rounded text-xs font-medium hover:bg-green-700 transition-colors">
                👁️ View
              </button>
            </div>
          </div>
        `
        
        marker.bindPopup(popupContent, { 
          maxWidth: 300,
          closeButton: true,
          className: 'custom-popup'
        })

        // Add click handler for navigation
        marker.on('click', () => {
          // Popup will show, and buttons inside will handle navigation
        })

        markers.push(marker)
      }
    })

    // Draw journey path if we have multiple points
    if (coordinates.length > 1) {
      const polyline = L.polyline(coordinates, { 
        color: '#2563eb', 
        weight: 3, 
        opacity: 0.7,
        dashArray: '5, 5' // Dashed line to show journey progression
      }).addTo(map)
      
      // Add a simple tooltip to explain the path
      polyline.bindTooltip('Your Camino journey route', {
        sticky: true,
        className: 'route-tooltip'
      })
    }

    // Fit map to show all markers with some padding
    if (markers.length > 0) {
      const group = L.featureGroup(markers)
      const bounds = group.getBounds()
      
      if (bounds.isValid()) {
        map.fitBounds(bounds.pad(0.1))
        
        // Ensure minimum zoom level for single markers
        if (markers.length === 1) {
          map.setZoom(Math.max(map.getZoom(), 10))
        }
      }
    }

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove()
        mapInstanceRef.current = null
      }
    }
  }, [entries, router])

  return (
    <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg border border-gray-200">
      <div ref={mapRef} className="w-full h-full" />
    </div>
  )
}