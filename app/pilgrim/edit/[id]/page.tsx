'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PhotoGallery from '@/components/ui/PhotoGallery'
import GPSDataInput from '@/components/forms/GPSDataInput'

interface LoadedEntry {
  id: string
  dayNumber: number
  date: string
  location: string
  title?: string
  content: string
  isPrivate: boolean
  isDraft: boolean
  googlePhotosAlbumUrl?: string
  albumCoverImageUrl?: string
  photos: Array<{
    id: string
    blobUrl: string
    filename: string
    isHero: boolean
  }>
  gpsData?: {
    id: string
    startLocation: string
    endLocation: string
    distanceKm?: number
    elevationGainM?: number
    durationMinutes?: number
    averageSpeedKmh?: number
    startTime?: string
    endTime?: string
    calories?: number
    averageHeartRate?: number
    maxHeartRate?: number
    source?: string
    externalActivityId?: string
    externalUrl?: string
    rawData?: string
  }
}

export default function EditEntryPage({ params }: { params: Promise<{ id: string }> }) {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [isLoadingEntry, setIsLoadingEntry] = useState(true)
  const [error, setError] = useState('')
  const [entryId, setEntryId] = useState<string>('')
  
  const [formData, setFormData] = useState({
    dayNumber: 1,
    date: new Date().toISOString().split('T')[0],
    location: '',
    title: '',
    content: '',
    isPrivate: false,
    isDraft: false,
    googlePhotosAlbumUrl: '',
    albumCoverImageUrl: ''
  })

  // Photo management state
  interface Photo {
    id: string
    file: File
    url: string
    isHero: boolean
    processed?: any
  }
  const [photos, setPhotos] = useState<Photo[]>([])
  const [isUploadingPhotos, setIsUploadingPhotos] = useState(false)
  const [photoUploadError, setPhotoUploadError] = useState('')
  const [photoUrls, setPhotoUrls] = useState<string[]>([])

  // Google Photos album cover upload state
  const [coverImageFile, setCoverImageFile] = useState<File | null>(null)
  const [coverImagePreview, setCoverImagePreview] = useState<string>('')
  const [isUploadingCover, setIsUploadingCover] = useState(false)

  // GPS data state
  interface GPSData {
    source: 'garmin' | 'manual'
    activityId?: string
    name: string
    startLocation: string
    endLocation: string
    distanceKm: number
    elevationGainM: number
    durationMinutes: number
    averageSpeedKmh: number
    startTime: Date
    endTime: Date
    calories?: number
    heartRateData?: { average: number; max: number }
    externalUrl?: string
    coordinates?: Array<{ lat: number; lng: number }>
  }
  const [gpsData, setGpsData] = useState<GPSData | null>(null)

  // Load entry data
  useEffect(() => {
    const loadEntry = async () => {
      try {
        const resolvedParams = await params
        setEntryId(resolvedParams.id)
        
        const response = await fetch(`/api/entries/${resolvedParams.id}`)
        if (!response.ok) {
          throw new Error('Entry not found')
        }
        
        const entry: LoadedEntry = await response.json()
        
        // Populate form data
        setFormData({
          dayNumber: entry.dayNumber,
          date: entry.date.split('T')[0], // Convert to YYYY-MM-DD format
          location: entry.location,
          title: entry.title || '',
          content: entry.content,
          isPrivate: entry.isPrivate,
          isDraft: entry.isDraft,
          googlePhotosAlbumUrl: entry.googlePhotosAlbumUrl || '',
          albumCoverImageUrl: entry.albumCoverImageUrl || ''
        })

        // Set existing cover image preview if available
        if (entry.albumCoverImageUrl) {
          setCoverImagePreview(entry.albumCoverImageUrl)
        }

        // Convert existing photos to Photo format
        if (entry.photos && entry.photos.length > 0) {
          const existingPhotoUrls = entry.photos.map(p => p.blobUrl)
          setPhotoUrls(existingPhotoUrls)
          
          // Create Photo objects for existing photos (without File objects since they're already uploaded)
          const existingPhotos: Photo[] = entry.photos.map(photo => ({
            id: photo.id,
            file: new File([], photo.filename), // Empty file since it's already uploaded
            url: photo.blobUrl,
            isHero: photo.isHero,
            processed: { url: photo.blobUrl }
          }))
          setPhotos(existingPhotos)
        }

        // Convert GPS data if it exists
        if (entry.gpsData) {
          const gps = entry.gpsData
          setGpsData({
            source: (gps.source as 'garmin' | 'manual') || 'manual',
            activityId: gps.externalActivityId,
            name: `Day ${entry.dayNumber} - ${entry.location}`,
            startLocation: gps.startLocation,
            endLocation: gps.endLocation,
            distanceKm: gps.distanceKm || 0,
            elevationGainM: gps.elevationGainM || 0,
            durationMinutes: gps.durationMinutes || 0,
            averageSpeedKmh: gps.averageSpeedKmh || 0,
            startTime: gps.startTime ? new Date(gps.startTime) : new Date(),
            endTime: gps.endTime ? new Date(gps.endTime) : new Date(),
            calories: gps.calories,
            heartRateData: gps.averageHeartRate ? {
              average: gps.averageHeartRate,
              max: gps.maxHeartRate || 0
            } : undefined,
            externalUrl: gps.externalUrl
          })
        }

        setIsLoadingEntry(false)
      } catch (error) {
        console.error('Failed to load entry:', error)
        setError('Failed to load entry')
        setIsLoadingEntry(false)
      }
    }

    loadEntry()
  }, [params])

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      let finalPhotoUrls = photoUrls
      let finalHeroPhotoIndex = -1
      let finalCoverImageUrl = formData.albumCoverImageUrl

      // Upload cover image if there is a new one
      if (coverImageFile) {
        try {
          finalCoverImageUrl = await uploadCoverImage()
        } catch (coverError) {
          throw new Error(`Cover image upload failed: ${coverError instanceof Error ? coverError.message : 'Unknown error'}`)
        }
      }

      // Upload new photos if there are any
      const newPhotos = photos.filter(photo => !photo.processed)
      if (newPhotos.length > 0) {
        setIsUploadingPhotos(true)
        
        try {
          const photoFormData = new FormData()
          newPhotos.forEach(photo => {
            photoFormData.append('photos', photo.file)
          })

          const photoResponse = await fetch('/api/upload/photos', {
            method: 'POST',
            body: photoFormData
          })

          if (!photoResponse.ok) {
            const photoData = await photoResponse.json()
            throw new Error(photoData.error || 'Failed to upload photos')
          }

          const photoData = await photoResponse.json()
          const newPhotoUrls = photoData.photos.map((p: any) => p.url)
          
          // Combine existing and new photo URLs
          finalPhotoUrls = [...photoUrls, ...newPhotoUrls]
          
          setPhotoUrls(finalPhotoUrls)
          setIsUploadingPhotos(false)
        } catch (photoError) {
          setIsUploadingPhotos(false)
          throw new Error(`Photo upload failed: ${photoError instanceof Error ? photoError.message : 'Unknown error'}`)
        }
      }

      // Find hero photo index
      finalHeroPhotoIndex = photos.findIndex(p => p.isHero)

      // Update the entry
      const response = await fetch(`/api/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isDraft: asDraft,
          albumCoverImageUrl: finalCoverImageUrl || undefined,
          photoUrls: finalPhotoUrls.length > 0 ? finalPhotoUrls : undefined,
          heroPhotoIndex: finalHeroPhotoIndex >= 0 ? finalHeroPhotoIndex : undefined,
          gpsData: gpsData || undefined
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to update entry')
        return
      }

      // Redirect to entry view or back to dashboard
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

  const handlePhotosChange = (newPhotos: Photo[]) => {
    setPhotos(newPhotos)
    setPhotoUploadError('')
  }

  const handlePhotoUploadStart = () => {
    setIsUploadingPhotos(true)
    setPhotoUploadError('')
  }

  const handlePhotoUploadComplete = (urls: string[]) => {
    setPhotoUrls(urls)
    setIsUploadingPhotos(false)
  }

  const handlePhotoUploadError = (error: string) => {
    setPhotoUploadError(error)
    setIsUploadingPhotos(false)
  }

  // Cover image upload handlers
  const handleCoverImageSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setCoverImageFile(file)
      const previewUrl = URL.createObjectURL(file)
      setCoverImagePreview(previewUrl)
    }
  }

  const uploadCoverImage = async () => {
    if (!coverImageFile) return null

    setIsUploadingCover(true)
    try {
      const formData = new FormData()
      formData.append('photos', coverImageFile)

      const response = await fetch('/api/upload/photos', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        console.error('Upload API error:', errorData)
        throw new Error(errorData.error || 'Failed to upload cover image')
      }

      const data = await response.json()
      console.log('Upload response:', data)
      
      if (!data.photos || !data.photos[0] || !data.photos[0].url) {
        throw new Error('Invalid upload response format')
      }
      
      return data.photos[0].url // Return the first photo URL
    } catch (error) {
      console.error('Cover image upload error:', error)
      throw error
    } finally {
      setIsUploadingCover(false)
    }
  }

  const removeCoverImage = () => {
    setCoverImageFile(null)
    setCoverImagePreview('')
    setFormData(prev => ({ ...prev, albumCoverImageUrl: '' }))
    if (coverImagePreview && coverImagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(coverImagePreview)
    }
  }

  const handleGPSDataChange = (newGpsData: GPSData | null) => {
    setGpsData(newGpsData)
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

  if (error && !entryId) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-red-600">{error}</div>
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
                Edit Entry
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Journal Content</h2>
              </div>
              
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  Write about your day on the Camino
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={12}
                  required
                  placeholder="Tell the story of your day... What did you see? How did you feel? What challenges did you face? Where did you stay? What food did you eat?"
                  value={formData.content}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border text-gray-900"
                />
                <div className="mt-3 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {formData.content.length} characters • {formData.content.split(' ').filter(word => word.length > 0).length} words
                  </p>
                  <div className="text-right">
                    <p className="text-xs text-gray-500">
                      💡 Tip: You can paste transcribed text from iPhone Voice Memos
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Photos Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Photos</h2>
                {photos.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {photos.length} photo{photos.length !== 1 ? 's' : ''} selected
                  </span>
                )}
              </div>
              
              <PhotoGallery
                photos={photos}
                onPhotosChange={handlePhotosChange}
                onUploadStart={handlePhotoUploadStart}
                onUploadComplete={handlePhotoUploadComplete}
                onUploadError={handlePhotoUploadError}
                isUploading={isUploadingPhotos}
              />
              
              {photoUploadError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-md p-4">
                  <div className="text-red-700 text-sm">
                    <strong>Photo upload error:</strong> {photoUploadError}
                  </div>
                </div>
              )}
              
              {photos.length > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Hero Image:</strong> The hero image will be displayed prominently in your journal entry and in the entry list.
                  </p>
                </div>
              )}
            </div>

            {/* GPS Data Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Route Data</h2>
                {gpsData && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    {gpsData.source === 'manual' ? 'Manual Entry' : 'From Garmin'}
                  </span>
                )}
              </div>
              
              <GPSDataInput
                date={formData.date}
                onGPSDataChange={handleGPSDataChange}
                isLoading={isLoading}
                initialData={gpsData}
              />
              
              {gpsData && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Route Information:</strong> GPS data helps family members follow your daily progress and adds rich context to your journal entries.
                  </p>
                </div>
              )}
            </div>

            {/* Google Photos Album Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Photo Album Link</h2>
                {formData.googlePhotosAlbumUrl && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    Album Linked
                  </span>
                )}
              </div>
              
              <div className="space-y-4">
                <div>
                  <label htmlFor="googlePhotosAlbumUrl" className="block text-sm font-medium text-gray-700 mb-1">
                    Google Photos Album URL (optional)
                  </label>
                  <input
                    type="url"
                    id="googlePhotosAlbumUrl"
                    name="googlePhotosAlbumUrl"
                    placeholder="https://photos.app.goo.gl/..."
                    value={formData.googlePhotosAlbumUrl}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    disabled={isLoading}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    Link to a Google Photos album containing all photos from this day
                  </p>
                </div>

                {formData.googlePhotosAlbumUrl && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Album Cover Image (optional)
                    </label>
                    
                    {!coverImagePreview ? (
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 rounded-full flex items-center justify-center">
                          <span className="text-xl">📷</span>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">Upload a cover image for your album</p>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleCoverImageSelect}
                          className="hidden"
                          id="cover-image-upload"
                          disabled={isLoading || isUploadingCover}
                        />
                        <label
                          htmlFor="cover-image-upload"
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium cursor-pointer disabled:opacity-50"
                        >
                          {isUploadingCover ? 'Uploading...' : 'Choose Cover Image'}
                        </label>
                        <p className="text-xs text-gray-500 mt-2">
                          If no cover is uploaded, a standard photo icon will be shown
                        </p>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="aspect-[4/3] bg-gray-100 rounded-lg overflow-hidden">
                          <img
                            src={coverImagePreview}
                            alt="Album cover preview"
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={removeCoverImage}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1"
                          disabled={isLoading || isUploadingCover}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {formData.googlePhotosAlbumUrl && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Photo Album:</strong> Family members will see a clickable album preview that opens your Google Photos album in a new tab.
                  </p>
                </div>
              )}
            </div>

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

            {/* Submit Button */}
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
                disabled={isLoading || isUploadingPhotos}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploadingPhotos}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Updating...' : 
                 isUploadingPhotos ? 'Uploading Photos...' : 
                 'Update Entry'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}