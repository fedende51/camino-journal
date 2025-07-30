import { prisma } from '@/lib/prisma'
import Link from 'next/link'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

interface Entry {
  id: string
  dayNumber: number
  date: string
  location: string
  title?: string
  content: string
  createdAt: string
  user: {
    name?: string
    email: string
  }
}

export default async function JournalPage() {
  // Fetch public entries
  const entries = await prisma.entry.findMany({
    where: {
      isPrivate: false
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      photos: true,
      gpsData: true
    },
    orderBy: [
      { date: 'desc' },
      { dayNumber: 'desc' }
    ]
  })
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <h1 className="text-3xl font-bold text-gray-900">
              Camino Journal
            </h1>
            <div className="text-sm text-gray-500">
              Public viewing - no login required
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Navigation options */}
          <div className="mb-8 flex space-x-4">
            <button className="bg-blue-600 text-white px-4 py-2 rounded-md font-medium">
              List View
            </button>
            <button className="bg-gray-200 text-gray-700 px-4 py-2 rounded-md font-medium hover:bg-gray-300">
              Map View
            </button>
          </div>

          {/* Entries List */}
          {entries.length === 0 ? (
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">📖</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No journal entries yet
              </h3>
              <p className="text-gray-500 mb-6">
                Journal entries will appear here once the pilgrim starts documenting their journey.
              </p>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-700 text-sm">
                  💡 This page is publicly accessible - family members can bookmark this URL to follow the journey without needing to create an account.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-8">
              {entries.map((entry) => (
                <article key={entry.id} className="bg-white shadow rounded-lg overflow-hidden">
                  {/* Hero Photo */}
                  {entry.photos.length > 0 ? (
                    (() => {
                      const heroPhoto = entry.photos.find(p => p.isHero) || entry.photos[0]
                      return (
                        <div className="relative w-full h-48 bg-gray-200 overflow-hidden">
                          <img
                            src={heroPhoto.blobUrl}
                            alt={entry.title || `Day ${entry.dayNumber} - ${entry.location}`}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute top-4 left-4 bg-white bg-opacity-90 text-gray-900 px-3 py-1 rounded-full text-sm font-medium">
                            Day {entry.dayNumber}
                          </div>
                          {entry.photos.length > 1 && (
                            <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                              +{entry.photos.length - 1} photos
                            </div>
                          )}
                        </div>
                      )
                    })()
                  ) : (
                    <div className="w-full h-48 bg-gradient-to-r from-blue-400 to-purple-500 flex items-center justify-center">
                      <div className="text-white text-center">
                        <div className="text-4xl mb-2">🚶‍♂️</div>
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
                          {new Date(entry.date).toLocaleDateString('en-US', {
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
                    
                    <div className="prose max-w-none mb-6">
                      <div className="text-gray-700 leading-relaxed">
                        {entry.content.length > 300 
                          ? `${entry.content.substring(0, 300)}...` 
                          : entry.content
                        }
                      </div>
                    </div>
                    
                    {/* GPS Data Preview */}
                    {entry.gpsData && (
                      <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                        <div className="flex justify-between items-center text-sm text-gray-600">
                          <span>
                            📍 {entry.gpsData.startLocation} → {entry.gpsData.endLocation}
                          </span>
                          <div className="flex space-x-4">
                            {entry.gpsData.distanceKm && (
                              <span>{entry.gpsData.distanceKm} km</span>
                            )}
                            {entry.gpsData.elevationGainM && (
                              <span>+{entry.gpsData.elevationGainM}m</span>
                            )}
                            {entry.gpsData.durationMinutes && (
                              <span>
                                {Math.floor(entry.gpsData.durationMinutes / 60)}h {entry.gpsData.durationMinutes % 60}m
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                    
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
              
              {/* Info about public access */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
                <h3 className="text-lg font-medium text-blue-900 mb-2">
                  Following the Journey
                </h3>
                <p className="text-blue-700 text-sm">
                  💡 This page is publicly accessible - bookmark this URL to follow the pilgrim&apos;s journey. No account needed!
                </p>
              </div>
            </div>
          )}

          {/* Sample entry structure (commented out for now) */}
          {/*
          <div className="space-y-6">
            <div className="bg-white shadow rounded-lg overflow-hidden">
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold">Day 1 - Saint-Jean-Pied-de-Port</h3>
                    <p className="text-sm text-gray-500">March 15, 2024</p>
                  </div>
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Public
                  </span>
                </div>
                
                <div className="mb-4">
                  <img 
                    src="/placeholder-hero.jpg" 
                    alt="Day 1 hero photo" 
                    className="w-full h-48 object-cover rounded-lg"
                  />
                </div>
                
                <p className="text-gray-700 mb-4">
                  Started the journey today from Saint-Jean-Pied-de-Port. The weather was perfect and spirits are high...
                </p>
                
                <div className="flex justify-between items-center text-sm text-gray-500">
                  <span>25.2 km • 6h 30m • +1,200m elevation</span>
                  <a href="#" className="text-blue-600 hover:text-blue-800">View photos</a>
                </div>
              </div>
            </div>
          </div>
          */}
        </div>
      </main>
    </div>
  )
}