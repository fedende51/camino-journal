'use client'

import { useEffect, useRef, useState } from 'react'
import { Loader } from '@googlemaps/js-api-loader'

interface GoogleMapRouteProps {
  startLocation: string
  endLocation: string
  className?: string
}

export default function GoogleMapRoute({ startLocation, endLocation, className = '' }: GoogleMapRouteProps) {
  const mapRef = useRef<HTMLDivElement>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [map, setMap] = useState<google.maps.Map | null>(null)

  useEffect(() => {
    if (!mapRef.current) return

    const initMap = async () => {
      try {
        const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
        if (!apiKey) {
          throw new Error('Google Maps API key not configured')
        }

        const loader = new Loader({
          apiKey,
          version: 'weekly',
          libraries: ['places', 'geometry']
        })

        const google = await loader.load()
        
        // Create map instance
        const mapInstance = new google.maps.Map(mapRef.current!, {
          zoom: 10,
          center: { lat: 42.8782, lng: -8.5449 }, // Santiago de Compostela as default center
          mapTypeId: google.maps.MapTypeId.TERRAIN,
          styles: [
            {
              featureType: 'poi',
              elementType: 'labels.text',
              stylers: [{ visibility: 'off' }]
            }
          ]
        })

        setMap(mapInstance)

        // Create DirectionsService and DirectionsRenderer
        const directionsService = new google.maps.DirectionsService()
        const directionsRenderer = new google.maps.DirectionsRenderer({
          suppressMarkers: false,
          polylineOptions: {
            strokeColor: '#2563eb', // Blue color matching the app theme
            strokeWeight: 4,
            strokeOpacity: 0.8
          }
        })

        directionsRenderer.setMap(mapInstance)

        // Request directions
        const request: google.maps.DirectionsRequest = {
          origin: startLocation,
          destination: endLocation,
          travelMode: google.maps.TravelMode.WALKING, // Walking mode for Camino
          unitSystem: google.maps.UnitSystem.METRIC,
        }

        directionsService.route(request, (result, status) => {
          if (status === 'OK' && result) {
            directionsRenderer.setDirections(result)

            // Add custom markers for start and end
            const route = result.routes[0]
            const leg = route.legs[0]

            // Start marker
            new google.maps.Marker({
              position: leg.start_location,
              map: mapInstance,
              title: `Start: ${startLocation}`,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#059669" stroke="white" stroke-width="3"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">S</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32)
              }
            })

            // End marker
            new google.maps.Marker({
              position: leg.end_location,
              map: mapInstance,
              title: `End: ${endLocation}`,
              icon: {
                url: 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                  <svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
                    <circle cx="16" cy="16" r="12" fill="#dc2626" stroke="white" stroke-width="3"/>
                    <text x="16" y="20" text-anchor="middle" fill="white" font-size="14" font-weight="bold">E</text>
                  </svg>
                `),
                scaledSize: new google.maps.Size(32, 32)
              }
            })

            setIsLoading(false)
          } else {
            console.error('Directions request failed:', status)
            setError('Unable to load route. The locations might be too far apart or invalid.')
            setIsLoading(false)
          }
        })

      } catch (err) {
        console.error('Error loading Google Maps:', err)
        setError(err instanceof Error ? err.message : 'Failed to load map')
        setIsLoading(false)
      }
    }

    initMap()
  }, [startLocation, endLocation])

  if (error) {
    return (
      <div className={`bg-gray-50 border border-gray-200 rounded-lg p-6 text-center ${className}`}>
        <div className="text-gray-600 mb-2">
          <span className="text-2xl">🗺️</span>
        </div>
        <p className="text-sm text-gray-600 mb-2">Unable to display route map</p>
        <p className="text-xs text-red-600">{error}</p>
        <div className="mt-3 text-sm text-gray-700">
          <p><strong>Route:</strong> {startLocation} → {endLocation}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative bg-gray-50 border border-gray-200 rounded-lg overflow-hidden ${className}`}>
      {isLoading && (
        <div className="absolute inset-0 bg-gray-50 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-sm text-gray-600">Loading route map...</p>
          </div>
        </div>
      )}
      <div ref={mapRef} className="w-full h-64 sm:h-80" />
      <div className="absolute bottom-2 left-2 right-2 bg-white bg-opacity-90 rounded px-3 py-2 text-xs">
        <p className="font-medium text-gray-900">Walking Route</p>
        <p className="text-gray-600">{startLocation} → {endLocation}</p>
      </div>
    </div>
  )
}