import { prisma } from '@/lib/prisma'
import { notFound } from 'next/navigation'
import Link from 'next/link'

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
      audioFiles: {
        select: {
          id: true,
          filename: true,
          transcription: true,
          processed: true
        }
      }
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
          
          {/* Hero Photo Placeholder */}
          {entry.photos.length > 0 ? (
            <div className="mb-8">
              <div className="bg-gray-200 rounded-lg h-64 flex items-center justify-center">
                <span className="text-gray-500">Hero Photo (Coming in Phase 2A)</span>
              </div>
            </div>
          ) : (
            <div className="mb-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-blue-700 text-sm">
                📸 Photo functionality coming in Phase 2A
              </p>
            </div>
          )}

          {/* Entry Content */}
          <div className="bg-white shadow rounded-lg p-8 mb-8">
            <div className="prose max-w-none">
              <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                {entry.content}
              </div>
            </div>
          </div>

          {/* Audio Files */}
          {entry.audioFiles.length > 0 && (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Audio Recordings</h3>
              <div className="space-y-3">
                {entry.audioFiles.map((audio) => (
                  <div key={audio.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-900">{audio.filename}</span>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        audio.processed ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {audio.processed ? 'Processed' : 'Processing...'}
                      </span>
                    </div>
                    {audio.transcription && (
                      <div className="mt-3 text-sm text-gray-600 bg-gray-50 rounded p-3">
                        <strong>Transcription:</strong> {audio.transcription}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* GPS Data */}
          {entry.gpsData ? (
            <div className="bg-white shadow rounded-lg p-6 mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Route Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {entry.gpsData.distanceKm && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">{entry.gpsData.distanceKm} km</div>
                    <div className="text-sm text-gray-500">Distance</div>
                  </div>
                )}
                {entry.gpsData.elevationGainM && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">+{entry.gpsData.elevationGainM} m</div>
                    <div className="text-sm text-gray-500">Elevation Gain</div>
                  </div>
                )}
                {entry.gpsData.durationMinutes && (
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {Math.floor(entry.gpsData.durationMinutes / 60)}h {entry.gpsData.durationMinutes % 60}m
                    </div>
                    <div className="text-sm text-gray-500">Duration</div>
                  </div>
                )}
              </div>
              
              <div className="mt-4 p-4 bg-gray-50 rounded-lg">
                <div className="text-sm text-gray-600">
                  <strong>Route:</strong> {entry.gpsData.startLocation} → {entry.gpsData.endLocation}
                </div>
              </div>
              
              {entry.gpsData.stravaActivityId && (
                <div className="mt-4">
                  <a 
                    href={`https://www.strava.com/activities/${entry.gpsData.stravaActivityId}`}
                    target="_blank"
                    rel="noopener noreferrer" 
                    className="text-orange-600 hover:text-orange-800 text-sm font-medium"
                  >
                    View on Strava →
                  </a>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-8">
              <p className="text-yellow-700 text-sm">
                🗺️ GPS data integration coming in Phase 2B
              </p>
            </div>
          )}

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