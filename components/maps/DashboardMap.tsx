'use client'

import dynamic from 'next/dynamic'
import { useEffect, useState } from 'react'
import { geocodeMultipleLocations } from '@/lib/geocoding'

// Only load Leaflet map on client side to avoid SSR issues
const DashboardMapClient = dynamic(
  () => import('./DashboardMapClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <div className="text-gray-500">Loading map...</div>
        </div>
      </div>
    )
  }
)

interface Entry {
  id: string
  dayNumber: number
  date: string
  location: string
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

interface DashboardMapProps {
  entries: Entry[]
}

interface EntryWithCoords extends Entry {
  latitude?: number
  longitude?: number
}

export default function DashboardMap({ entries }: DashboardMapProps) {
  const [entriesWithCoords, setEntriesWithCoords] = useState<EntryWithCoords[]>([])
  const [isLoadingCoords, setIsLoadingCoords] = useState(true)
  const [geocodingProgress, setGeocodingProgress] = useState(0)

  useEffect(() => {
    const geocodeEntries = async () => {
      if (entries.length === 0) {
        setIsLoadingCoords(false)
        return
      }

      setIsLoadingCoords(true)
      setGeocodingProgress(0)

      try {
        // Extract unique locations
        const uniqueLocations = [...new Set(entries.map(entry => entry.location))]
        
        // Geocode all locations
        const locationCoords = await geocodeMultipleLocations(uniqueLocations)
        
        // Map coordinates back to entries
        const entriesWithCoordinates: EntryWithCoords[] = entries.map(entry => {
          const coords = locationCoords.get(entry.location)
          return {
            ...entry,
            latitude: coords?.latitude,
            longitude: coords?.longitude
          }
        })

        setEntriesWithCoords(entriesWithCoordinates)
        setGeocodingProgress(100)
      } catch (error) {
        console.error('Error geocoding entries:', error)
        // Set entries without coordinates as fallback
        setEntriesWithCoords(entries)
      } finally {
        setIsLoadingCoords(false)
      }
    }

    geocodeEntries()
  }, [entries])

  if (entries.length === 0) {
    return (
      <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg bg-gray-50 flex items-center justify-center border-2 border-dashed border-gray-300">
        <div className="text-center p-4 md:p-8">
          <div className="w-12 h-12 md:w-16 md:h-16 mx-auto mb-3 md:mb-4 bg-gray-100 rounded-full flex items-center justify-center">
            <span className="text-xl md:text-2xl">🗺️</span>
          </div>
          <h3 className="text-base md:text-lg font-medium text-gray-900 mb-2">Journey Map</h3>
          <p className="text-gray-500 text-xs md:text-sm leading-relaxed">
            Your journal entries will appear as pins on this map as you document your Camino journey.
          </p>
        </div>
      </div>
    )
  }

  if (isLoadingCoords) {
    return (
      <div className="w-full h-[400px] md:h-[500px] rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <div className="text-center p-4">
          <div className="animate-spin h-6 w-6 md:h-8 md:w-8 border-2 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
          <div className="text-gray-500 mb-2 text-sm md:text-base">Mapping your journey...</div>
          {geocodingProgress > 0 && (
            <div className="w-36 md:w-48 bg-gray-200 rounded-full h-2 mx-auto">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                style={{ width: `${geocodingProgress}%` }}
              ></div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return <DashboardMapClient entries={entriesWithCoords} />
}