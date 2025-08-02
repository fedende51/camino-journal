import { prisma } from '@/lib/prisma'
import JournalContent from '@/components/ui/JournalContent'
import Link from 'next/link'

// Disable static generation for this page
export const dynamic = 'force-dynamic'

export default async function Home() {
  // Fetch active pilgrims (users with journal slugs and public entries)
  const activePilgrims = await prisma.user.findMany({
    where: {
      journalSlug: {
        not: null
      },
      entries: {
        some: {
          isPrivate: false
        }
      }
    },
    select: {
      id: true,
      name: true,
      journalSlug: true,
      journalTitle: true,
      createdAt: true,
      entries: {
        where: {
          isPrivate: false
        },
        select: {
          id: true,
          dayNumber: true,
          date: true,
          location: true,
          photos: {
            where: {
              isHero: true
            },
            take: 1,
            select: {
              blobUrl: true
            }
          }
        },
        orderBy: {
          date: 'desc'
        },
        take: 1
      },
      _count: {
        select: {
          entries: {
            where: {
              isPrivate: false
            }
          }
        }
      }
    },
    orderBy: {
      createdAt: 'desc'
    }
  })

  // Fetch recent public entries from all pilgrims
  const recentEntries = await prisma.entry.findMany({
    where: {
      isPrivate: false
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          journalSlug: true
        }
      },
      photos: true,
      gpsData: true
    },
    orderBy: [
      { date: 'desc' },
      { dayNumber: 'desc' }
    ],
    take: 6
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Pilgrim Login */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Camino de Santiago Journeys
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                Follow active pilgrims on their journey - Family & friends welcome
              </p>
            </div>
            
            {/* Pilgrim Login Button */}
            <div className="flex items-center space-x-3">
              <div className="hidden sm:block text-sm text-gray-500">
                Are you a pilgrim?
              </div>
              <Link
                href="/login"
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                <span>Pilgrim Login</span>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Active Pilgrims Section */}
          {activePilgrims.length > 0 && (
            <section className="mb-12">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                🚶‍♂️ Active Pilgrims ({activePilgrims.length})
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {activePilgrims.map((pilgrim) => {
                  const latestEntry = pilgrim.entries[0]
                  const heroPhoto = latestEntry?.photos?.[0]?.blobUrl
                  
                  return (
                    <div key={pilgrim.id} className="bg-white rounded-lg shadow hover:shadow-md transition-shadow overflow-hidden">
                      {/* Hero Image */}
                      {heroPhoto && (
                        <div className="h-48 bg-gray-200">
                          <img
                            src={heroPhoto}
                            alt={`${pilgrim.name}'s latest update`}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      )}
                      
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">
                          {pilgrim.journalTitle || `${pilgrim.name}'s Journey`}
                        </h3>
                        
                        {latestEntry && (
                          <div className="text-sm text-gray-600 mb-4">
                            <p className="mb-1">
                              <strong>Latest:</strong> Day {latestEntry.dayNumber} - {latestEntry.location}
                            </p>
                            <p className="text-xs">
                              {latestEntry.date.toLocaleDateString()}
                            </p>
                          </div>
                        )}
                        
                        <div className="flex items-center justify-between">
                          <div className="text-sm text-gray-500">
                            {pilgrim._count.entries} entries
                          </div>
                          <Link
                            href={`/journal/${pilgrim.journalSlug}`}
                            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded text-sm font-medium transition-colors"
                          >
                            Follow Journey →
                          </Link>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </section>
          )}

          {/* Recent Entries Section */}
          {recentEntries.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  📋 Latest Updates
                </h2>
                <p className="text-sm text-gray-500">
                  Recent entries from all active pilgrims
                </p>
              </div>
              
              <div className="space-y-6">
                {recentEntries.map((entry) => (
                  <article key={entry.id} className="bg-white shadow rounded-lg overflow-hidden hover:shadow-md transition-shadow">
                    {/* Entry Header with Pilgrim Info */}
                    <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="flex-shrink-0">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <span className="text-blue-600 text-sm font-medium">
                                {entry.user.name?.charAt(0) || 'P'}
                              </span>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {entry.user.name}'s Journal
                            </p>
                            <p className="text-xs text-gray-500">
                              Day {entry.dayNumber} - {entry.location}
                            </p>
                          </div>
                        </div>
                        {entry.user.journalSlug && (
                          <Link
                            href={`/journal/${entry.user.journalSlug}`}
                            className="text-blue-600 hover:text-blue-500 text-sm font-medium"
                          >
                            View Full Journal →
                          </Link>
                        )}
                      </div>
                    </div>

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
                            {entry.title || `Day ${entry.dayNumber} - ${entry.location}`}
                          </h2>
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
                          </div>
                        </div>
                      )}
                      
                      <div className="prose max-w-none mb-6">
                        <div className="text-gray-700 leading-relaxed">
                          {entry.content.length > 200 
                            ? `${entry.content.substring(0, 200)}...`
                            : entry.content
                          }
                        </div>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-500">
                          {entry.content.split(' ').length} words
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
            </section>
          )}

          {/* Empty State */}
          {activePilgrims.length === 0 && recentEntries.length === 0 && (
            <div className="text-center py-12">
              <div className="mx-auto h-12 w-12 text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 48 48" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M34 40h10v-4a6 6 0 00-10.712-3.714M34 40H14m20 0v-4a9.971 9.971 0 00-.712-3.714M14 40H4v-4a6 6 0 0110.712-3.714M14 40v-4a9.971 9.971 0 01.712-3.714M28 16a4 4 0 11-8 0 4 4 0 018 0zM24 20a9.971 9.971 0 00-6.712 2.714M24 20a9.971 9.971 0 016.712 2.714" />
                </svg>
              </div>
              <h2 className="mt-2 text-lg font-medium text-gray-900">
                🌟 No active pilgrims yet
              </h2>
              <p className="mt-1 text-sm text-gray-500">
                Be the first to start sharing your Camino journey!
              </p>
              <div className="mt-6">
                <Link
                  href="/register"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
                >
                  Start Your Journey →
                </Link>
              </div>
            </div>
          )}

          {/* Info about the platform */}
          <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-6 text-center">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              Following the Camino Journey
            </h3>
            <p className="text-blue-700 text-sm">
              💡 Each pilgrim has their own shareable journal URL. Bookmark individual journals to follow specific pilgrims, or check this page for updates from all active journeys.
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}