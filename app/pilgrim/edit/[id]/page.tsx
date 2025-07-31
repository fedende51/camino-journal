'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

interface Entry {
  id: string
  dayNumber: number
  date: string
  location: string
  title?: string
  content: string
  isPrivate: boolean
  isDraft: boolean
  createdAt: string
  user: {
    name?: string
    email: string
  }
  photos: Array<{
    id: string
    blobUrl: string
    filename: string
    isHero: boolean
  }>
  audioFiles: Array<{
    id: string
    blobUrl: string
    filename: string
  }>
  gpsData?: {
    id: string
    startLocation: string
    endLocation: string
    distanceKm?: number
    elevationGainM?: number
  }
}

export default function EditEntryPage({ params }: { params: { id: string } }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEntry, setIsLoadingEntry] = useState(true)
  const [error, setError] = useState('')
  const [entry, setEntry] = useState<Entry | null>(null)
  
  const [formData, setFormData] = useState({
    dayNumber: 1,
    date: new Date().toISOString().split('T')[0],
    location: '',
    title: '',
    content: '',
    isPrivate: false,
    isDraft: false
  })

  // Load entry data
  useEffect(() => {
    const fetchEntry = async () => {
      try {
        const response = await fetch(`/api/entries/${params.id}`)
        const data = await response.json()
        
        if (!response.ok) {
          setError(data.error || 'Failed to load entry')
          return
        }

        const entry = data.entry
        setEntry(entry)
        setFormData({
          dayNumber: entry.dayNumber,
          date: new Date(entry.date).toISOString().split('T')[0],
          location: entry.location,
          title: entry.title || '',
          content: entry.content,
          isPrivate: entry.isPrivate,
          isDraft: entry.isDraft
        })
      } catch (error) {
        setError('Failed to load entry')
      } finally {
        setIsLoadingEntry(false)
      }
    }

    if (params.id) {
      fetchEntry()
    }
  }, [params.id])

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      const response = await fetch(`/api/entries/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isDraft: asDraft
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update entry')
        return
      }

      // Redirect back to dashboard with success message
      router.push(`/pilgrim?success=Entry updated successfully`)
    } catch (error) {
      setError('Something went wrong')
    } finally {
      setIsLoading(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }))
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Please log in to edit entries.</div>
      </div>
    )
  }

  if (isLoadingEntry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Loading entry...</div>
      </div>
    )
  }

  if (error && !entry) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error}</div>
          <Link
            href="/pilgrim"
            className="text-blue-600 hover:text-blue-800"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <Link href="/pilgrim" className="text-blue-600 hover:text-blue-800 text-sm">
                ← Back to Dashboard
              </Link>
              <h1 className="text-2xl font-bold text-gray-900 mt-2">
                Edit Entry - Day {entry?.dayNumber}
              </h1>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto py-6 sm:px-6 lg:px-8">
        <div className="px-4 py-6 sm:px-0">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Basic Information Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-6">Basic Information</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label htmlFor="dayNumber" className="block text-sm font-medium text-gray-700">
                    Day Number
                  </label>
                  <input
                    type="number"
                    id="dayNumber"
                    name="dayNumber"
                    min="1"
                    required
                    value={formData.dayNumber}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="date" className="block text-sm font-medium text-gray-700">
                    Date
                  </label>
                  <input
                    type="date"
                    id="date"
                    name="date"
                    required
                    value={formData.date}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                  />
                </div>

                <div>
                  <label htmlFor="location" className="block text-sm font-medium text-gray-700">
                    Location/Town
                  </label>
                  <input
                    type="text"
                    id="location"
                    name="location"
                    required
                    placeholder="e.g., Saint-Jean-Pied-de-Port"
                    value={formData.location}
                    onChange={handleChange}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                  />
                </div>
              </div>

              <div className="mt-6">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  Entry Title (optional)
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  placeholder="e.g., First day on the Camino"
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
              </div>
            </div>

            {/* Journal Content Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Journal Content</h2>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Edit your journal entry
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={12}
                  required
                  placeholder="Tell the story of your day... What did you see? How did you feel? What challenges did you face?"
                  value={formData.content}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {formData.content.length} characters • {formData.content.split(' ').filter(word => word.length > 0).length} words
                  </p>
                </div>
              </div>
            </div>

            {/* Existing Media Section */}
            {(entry?.photos && entry.photos.length > 0) || (entry?.audioFiles && entry.audioFiles.length > 0) || entry?.gpsData ? (
              <div className="bg-white shadow rounded-lg p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">Existing Media & Data</h2>
                
                {entry.photos && entry.photos.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Photos ({entry.photos.length})</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {entry.photos.map((photo) => (
                        <div key={photo.id} className="relative">
                          <img
                            src={photo.blobUrl}
                            alt={photo.filename}
                            className="w-full h-24 object-cover rounded"
                          />
                          {photo.isHero && (
                            <span className="absolute top-1 right-1 bg-yellow-500 text-white text-xs px-1 rounded">
                              Hero
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {entry.audioFiles && entry.audioFiles.length > 0 && (
                  <div className="mb-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Audio Files ({entry.audioFiles.length})</h3>
                    {entry.audioFiles.map((audio) => (
                      <div key={audio.id} className="flex items-center space-x-2 mb-2">
                        <span className="text-sm">🎤</span>
                        <span className="text-sm text-gray-600">{audio.filename}</span>
                        <audio controls className="h-8">
                          <source src={audio.blobUrl} type="audio/mpeg" />
                        </audio>
                      </div>
                    ))}
                  </div>
                )}

                {entry.gpsData && (
                  <div>
                    <h3 className="text-sm font-medium text-gray-700 mb-2">GPS Data</h3>
                    <div className="text-sm text-gray-600">
                      <p><strong>Route:</strong> {entry.gpsData.startLocation} → {entry.gpsData.endLocation}</p>
                      {entry.gpsData.distanceKm && (
                        <p><strong>Distance:</strong> {entry.gpsData.distanceKm} km</p>
                      )}
                      {entry.gpsData.elevationGainM && (
                        <p><strong>Elevation:</strong> {entry.gpsData.elevationGainM} m</p>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-gray-500 mt-4">
                  Note: You can only edit text content. To modify photos, audio, or GPS data, create a new entry.
                </p>
              </div>
            ) : null}

            {/* Privacy Settings */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Privacy Settings</h2>
              <div className="flex items-center">
                <input
                  id="isPrivate"
                  name="isPrivate"
                  type="checkbox"
                  checked={formData.isPrivate}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isPrivate" className="ml-2 block text-sm text-gray-900">
                  Make this entry private (only visible to you)
                </label>
              </div>
              <p className="mt-2 text-sm text-gray-500">
                {formData.isPrivate 
                  ? "This entry will be private - family members won't see it in the public journal."
                  : "This entry will be public - family members can view it at the journal page."
                }
              </p>
            </div>

            {/* Error Display */}
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="text-red-700">{error}</div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex justify-end space-x-4">
              <Link
                href="/pilgrim"
                className="bg-gray-300 hover:bg-gray-400 text-gray-700 px-6 py-2 rounded-md text-sm font-medium"
              >
                Cancel
              </Link>
              <button
                type="button"
                onClick={(e) => handleSubmit(e, true)}
                disabled={isLoading}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Publishing...' : 'Publish Entry'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}