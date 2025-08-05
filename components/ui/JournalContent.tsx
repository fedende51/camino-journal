'use client'

import { useState } from 'react'
import Link from 'next/link'
import DashboardMap from '../maps/DashboardMap'

interface Entry {
  id: string
  dayNumber: number
  date: Date
  location: string
  title?: string | null
  content: string
  createdAt: Date
  user: {
    name?: string | null
    email: string
  }
  photos: any[]
  gpsData?: {
    id: string
    startLocation: string
    endLocation: string
    distanceKm?: number | null
    elevationGainM?: number | null
    durationMinutes?: number | null
  } | null
}

interface JournalContentProps {
  entries: Entry[]
}

export default function JournalContent({ entries }: JournalContentProps) {
  return (
    <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        
        {/* Chronological entries */}
        <TimelineView entries={entries} />
        
        {/* Map section */}
        <div className="mt-12">
          <MapSection entries={entries} />
        </div>
        
        {/* Statistics section */}
        <div className="mt-12">
          <StatisticsSection entries={entries} />
        </div>
        
      </div>
    </main>
  )
}

function TimelineView({ entries }: { entries: Entry[] }) {
  if (entries.length === 0) {
    return (
      <div className="bg-white shadow rounded-lg p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
          <span className="text-2xl">📖</span>
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No journal entries yet
        </h3>
        <p className="text-gray-500">
          Check back soon for updates from the Camino journey!
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {entries.map((entry) => (
        <article key={entry.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
          {/* Hero photo if available */}
          {entry.photos && entry.photos.length > 0 && (
            <div className="relative h-64 bg-gray-200">
              <img
                src={entry.photos.find(p => p.isHero)?.blobUrl || entry.photos[0].blobUrl}
                alt={`Day ${entry.dayNumber} - ${entry.location}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-4 left-4 bg-black bg-opacity-50 text-white px-3 py-1 rounded-full">
                <div className="text-lg font-medium">Day {entry.dayNumber}</div>
              </div>
            </div>
          )}
          
          <div className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Day {entry.dayNumber} - {entry.location}
                </h2>
                {entry.title && (
                  <h3 className="text-lg text-gray-700 mt-1">{entry.title}</h3>
                )}
                <p className="text-sm text-gray-500 mt-2">
                  {entry.date.toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </p>
              </div>
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                Public
              </span>
            </div>
            
            {/* GPS data summary */}
            {entry.gpsData && (
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <span className="text-blue-600 mr-1">📍</span>
                    <span className="text-gray-700">
                      {entry.gpsData.startLocation} → {entry.gpsData.endLocation}
                    </span>
                  </div>
                  {entry.gpsData.distanceKm && (
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-1">📏</span>
                      <span className="text-gray-700">{entry.gpsData.distanceKm} km</span>
                    </div>
                  )}
                  {entry.gpsData.elevationGainM && (
                    <div className="flex items-center">
                      <span className="text-blue-600 mr-1">⛰️</span>
                      <span className="text-gray-700">{entry.gpsData.elevationGainM}m</span>
                    </div>
                  )}
                </div>
              </div>
            )}
            
            <div className="prose max-w-none mb-6">
              <div className="text-gray-700 leading-relaxed">
                {entry.content.split('\n').map((paragraph, index) => (
                  <p key={index} className="mb-3 last:mb-0">
                    {paragraph}
                  </p>
                ))}
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-500">
                {entry.content.split(' ').length} words • {entry.content.length} characters
              </div>
              <Link
                href={`/entry/${entry.id}`}
                className="text-blue-600 hover:text-blue-800 font-medium text-sm"
              >
                Read full entry →
              </Link>
            </div>
          </div>
        </article>
      ))}
    </div>
  )
}

function MapSection({ entries }: { entries: Entry[] }) {
  // Normalize entries to match DashboardMap expected format
  const normalizedEntries = entries.map(entry => ({
    ...entry,
    date: entry.date instanceof Date ? entry.date.toISOString() : entry.date,
    photos: entry.photos || []
  }))

  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">🗺️ Journey Map</h2>
      <DashboardMap entries={normalizedEntries} />
    </div>
  )
}

function StatisticsSection({ entries }: { entries: Entry[] }) {
  return (
    <div className="bg-white rounded-lg p-6 shadow">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">📊 Journey Statistics</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{entries.length}</div>
          <div className="text-sm text-gray-500">Days</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {entries.filter(e => e.gpsData).length}
          </div>
          <div className="text-sm text-gray-500">With GPS</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">
            {entries.reduce((acc, e) => acc + (e.photos?.length || 0), 0)}
          </div>
          <div className="text-sm text-gray-500">Photos</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">
            {Math.round(
              entries.reduce((acc, e) => acc + (e.gpsData?.distanceKm || 0), 0)
            )}
          </div>
          <div className="text-sm text-gray-500">km Total</div>
        </div>
      </div>
    </div>
  )
}