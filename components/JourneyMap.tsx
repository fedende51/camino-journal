'use client'

import dynamic from 'next/dynamic'

// Only load Leaflet map on client side to avoid SSR issues
const LeafletMapClient = dynamic(
  () => import('./LeafletMapClient'),
  { 
    ssr: false,
    loading: () => (
      <div className="w-full h-[600px] rounded-lg overflow-hidden shadow-lg bg-gray-100 flex items-center justify-center">
        <div className="text-gray-500">Loading map...</div>
      </div>
    )
  }
)

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

interface JourneyMapProps {
  entries: Entry[]
}

export default function JourneyMap({ entries }: JourneyMapProps) {
  return <LeafletMapClient entries={entries} />
}