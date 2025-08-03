import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import GoogleMapRoute from '@/components/ui/GoogleMapRoute'

interface EntryPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function EntryPage({ params }: EntryPageProps) {
  const { id } = await params
  const entry = await prisma.entry.findUnique({
    where: {
      id,
    },
    include: {
      user: {
        select: {
          name: true,
          email: true
        }
      },
      photos: true,
      gpsData: true,
    }
  })

  if (!entry) {
    notFound()
  }

  // If entry is private, show message (in real app, we'd check auth)
  if (entry.isPrivate) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="py-6">
              <Link href="/journal" className="text-blue-600 hover:text-blue-800 text-sm">
                ← Back to Journal
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Private Entry
              </h1>
            </div>
          </div>
        </header>

        <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
          <div className="px-4 py-6 sm:px-0">
            <div className="bg-white shadow rounded-lg p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                <span className="text-2xl">🔒</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                This entry is private
              </h3>
              <p className="text-gray-500">
                The pilgrim has marked this entry as private. Only they can view its contents.
              </p>
            </div>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="py-6">
            <Link href="/journal" className="text-blue-600 hover:text-blue-800 text-sm">
              ← Back to Journal
            </Link>
            <div className="mt-2">
              <h1 className="text-2xl font-bold text-gray-900">
                Day {entry.dayNumber} - {entry.location}
              </h1>
              {entry.title && (
                <p className="text-lg text-gray-600 mt-1">{entry.title}</p>
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
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          
          {/* Hero Photo */}
          {entry.photos.length > 0 ? (
            <div className="mb-8">
              {(() => {
                const heroPhoto = entry.photos.find(p => p.isHero) || entry.photos[0]
                return (
                  <div className="relative">
                    <div className="aspect-[16/9] bg-gray-200 rounded-lg overflow-hidden">
                      <img
                        src={heroPhoto.blobUrl}
                        alt={entry.title || `Day ${entry.dayNumber} - ${entry.location}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    {entry.photos.length > 1 && (
                      <div className="absolute top-4 right-4 bg-black bg-opacity-75 text-white px-3 py-1 rounded-full text-sm">
                        +{entry.photos.length - 1} more
                      </div>
                    )}
                  </div>
                )
              })()}
            </div>
          ) : null}

          {/* Entry Content */}
          <div className="bg-white shadow rounded-lg p-8 mb-8">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {entry.content}
              </div>
            </div>
          </div>


          {/* Photo Gallery */}
          {entry.photos.length > 1 && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                📸 Photo Gallery ({entry.photos.length} photos)
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {entry.photos.map((photo, index) => (
                  <div key={photo.id} className="relative group">
                    <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden cursor-pointer">
                      <img
                        src={photo.blobUrl}
                        alt={`Photo ${index + 1}`}
                        className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      />
                    </div>
                    {photo.isHero && (
                      <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                        Hero
                      </div>
                    )}
                    {/* Photo overlay on hover */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-25 transition-all duration-200 rounded-lg flex items-center justify-center">
                      <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                        <button className="bg-white text-gray-900 px-3 py-1 rounded-full text-sm font-medium shadow-lg">
                          View Full Size
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>💡 Photo Gallery:</strong> Click any photo to view it in full size. The hero image is featured at the top of this entry.
                </p>
              </div>
            </div>
          )}

          {/* GPS Data */}
          {entry.gpsData ? (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-gray-900">🗺️ Route Information</h3>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    entry.gpsData.source === 'garmin' ? 'bg-blue-100 text-blue-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {entry.gpsData.source === 'garmin' ? 'Garmin' : 'Manual Entry'}
                  </span>
                </div>
              </div>
              
              {/* Main Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{entry.gpsData.distanceKm} km</div>
                  <div className="text-sm text-gray-500">Distance</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">+{entry.gpsData.elevationGainM} m</div>
                  <div className="text-sm text-gray-500">Elevation Gain</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {entry.gpsData.durationMinutes ? `${Math.floor(entry.gpsData.durationMinutes / 60)}h ${entry.gpsData.durationMinutes % 60}m` : 'N/A'}
                  </div>
                  <div className="text-sm text-gray-500">Duration</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-indigo-600">{entry.gpsData.averageSpeedKmh || 'N/A'} km/h</div>
                  <div className="text-sm text-gray-500">Avg Speed</div>
                </div>
              </div>
              
              {/* Interactive Route Map */}
              <div className="mb-4">
                <GoogleMapRoute 
                  startLocation={entry.gpsData.startLocation}
                  endLocation={entry.gpsData.endLocation}
                />
              </div>

              {/* Route Details */}
              <div className="bg-gray-50 rounded-lg p-4 mb-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Start Time:</span>
                    <div className="font-medium">{entry.gpsData.startTime ? new Date(entry.gpsData.startTime).toLocaleTimeString() : 'N/A'}</div>
                  </div>
                  <div>
                    <span className="text-gray-500">End Time:</span>
                    <div className="font-medium">{entry.gpsData.endTime ? new Date(entry.gpsData.endTime).toLocaleTimeString() : 'N/A'}</div>
                  </div>
                </div>
              </div>

              {/* Additional Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                {entry.gpsData.calories && (
                  <div className="bg-red-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-red-600">{entry.gpsData.calories}</div>
                    <div className="text-red-500">Calories</div>
                  </div>
                )}
                {entry.gpsData.averageHeartRate && (
                  <div className="bg-pink-50 rounded-lg p-3 text-center">
                    <div className="text-lg font-semibold text-pink-600">{entry.gpsData.averageHeartRate} bpm</div>
                    <div className="text-pink-500">Avg Heart Rate</div>
                  </div>
                )}
                <div className="bg-blue-50 rounded-lg p-3 text-center">
                  <div className="text-lg font-semibold text-blue-600">
                    {(entry.gpsData.durationMinutes && entry.gpsData.distanceKm) 
                      ? `${Math.round((entry.gpsData.durationMinutes / entry.gpsData.distanceKm) * 100) / 100} min/km`
                      : 'N/A'}
                  </div>
                  <div className="text-blue-500">Pace</div>
                </div>
              </div>
              
              {/* External Link */}
              {entry.gpsData.externalUrl && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <a 
                    href={entry.gpsData.externalUrl}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="inline-flex items-center text-sm font-medium hover:underline text-blue-600 hover:text-blue-800"
                  >
                    View on {entry.gpsData.source === 'garmin' ? 'Garmin Connect' : 'External Link'} →
                  </a>
                </div>
              )}
            </div>
          ) : null}

          {/* Entry Metadata */}
          <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Entry Details</h3>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="font-medium text-gray-900">Day Number</dt>
                <dd className="text-gray-600">Day {entry.dayNumber}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Location</dt>
                <dd className="text-gray-600">{entry.location}</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Date</dt>
                <dd className="text-gray-600">
                  {new Date(entry.date).toLocaleDateString()}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Privacy</dt>
                <dd className="text-gray-600">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs">
                    Public
                  </span>
                </dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Word Count</dt>
                <dd className="text-gray-600">{entry.content.split(' ').length} words</dd>
              </div>
              <div>
                <dt className="font-medium text-gray-900">Created</dt>
                <dd className="text-gray-600">
                  {new Date(entry.createdAt).toLocaleDateString()}
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </main>
    </div>
  )
}