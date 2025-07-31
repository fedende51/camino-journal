'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import PhotoGallery from '@/components/ui/PhotoGallery'
import GPSDataInput from '@/components/forms/GPSDataInput'

export default function CreateEntryPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  
  const [formData, setFormData] = useState({
    dayNumber: 1,
    date: new Date().toISOString().split('T')[0], // Today's date
    location: '',
    title: '',
    content: '',
    isPrivate: false,
    isDraft: false
  })

  // Audio processing state
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [transcriptionProgress, setTranscriptionProgress] = useState('')
  const [audioUrl, setAudioUrl] = useState('')

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

  // GPS data state
  interface GPSData {
    source: 'strava' | 'garmin' | 'manual'
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

  const handleSubmit = async (e: React.FormEvent, asDraft = false) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      let finalPhotoUrls = photoUrls
      let finalHeroPhotoIndex = -1

      // Upload photos first if there are any
      if (photos.length > 0) {
        setIsUploadingPhotos(true)
        
        try {
          const photoFormData = new FormData()
          photos.forEach(photo => {
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
          finalPhotoUrls = photoData.photos.map((p: any) => p.url)
          finalHeroPhotoIndex = photos.findIndex(p => p.isHero)
          
          setPhotoUrls(finalPhotoUrls)
          setIsUploadingPhotos(false)
        } catch (photoError) {
          setIsUploadingPhotos(false)
          throw new Error(`Photo upload failed: ${photoError instanceof Error ? photoError.message : 'Unknown error'}`)
        }
      }

      // Create the entry with uploaded photo URLs
      const response = await fetch('/api/entries', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          isDraft: asDraft,
          audioUrl: audioUrl || undefined, // Include audio URL if available
          photoUrls: finalPhotoUrls.length > 0 ? finalPhotoUrls : undefined, // Include uploaded photo URLs
          heroPhotoIndex: finalHeroPhotoIndex >= 0 ? finalHeroPhotoIndex : undefined, // Index of hero photo
          gpsData: gpsData || undefined // Include GPS data if available
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Failed to create entry')
        return
      }

      // Redirect to entry view or back to dashboard
      router.push(`/pilgrim?success=Entry created successfully`)
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

  const handleAudioUpload = async (file: File) => {
    setIsUploading(true)
    setTranscriptionProgress('Uploading audio file...')
    
    try {
      // Upload audio to Vercel Blob
      const uploadFormData = new FormData()
      uploadFormData.append('audio', file)
      
      const uploadResponse = await fetch('/api/upload/audio', {
        method: 'POST',
        body: uploadFormData
      })
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio file')
      }
      
      const uploadResult = await uploadResponse.json()
      setAudioUrl(uploadResult.url)
      
      // Start transcription
      setIsTranscribing(true)
      setTranscriptionProgress('Transcribing audio...')
      
      const transcribeResponse = await fetch('/api/transcribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          audioUrl: uploadResult.url,
          context: {
            location: formData.location,
            dayNumber: formData.dayNumber,
            date: formData.date
          }
        })
      })
      
      if (!transcribeResponse.ok) {
        throw new Error('Transcription failed')
      }
      
      const transcribeResult = await transcribeResponse.json()
      
      if (transcribeResult.status === 'completed') {
        setTranscriptionProgress('Processing text...')
        
        // Update content with cleaned text
        setFormData(prev => ({
          ...prev,
          content: transcribeResult.cleanedText || transcribeResult.originalText
        }))
        
        setTranscriptionProgress('Audio processed successfully! ✅')
      } else {
        // Handle async transcription (poll for completion)
        pollTranscriptionStatus(transcribeResult.transcriptionId)
      }
      
    } catch (error) {
      console.error('Audio processing error:', error)
      setTranscriptionProgress(`Error: ${error instanceof Error ? error.message : 'Audio processing failed'}`)
    } finally {
      setIsUploading(false)
    }
  }

  const pollTranscriptionStatus = async (transcriptionId: string) => {
    const maxAttempts = 30 // 5 minutes max (10s intervals)
    let attempts = 0
    
    const poll = async () => {
      try {
        attempts++
        setTranscriptionProgress(`Transcribing... (${attempts}/${maxAttempts})`)
        
        const response = await fetch(`/api/transcribe?id=${transcriptionId}`)
        if (!response.ok) throw new Error('Failed to check transcription status')
        
        const result = await response.json()
        
        if (result.status === 'completed') {
          setFormData(prev => ({
            ...prev,
            content: result.cleanedText || result.originalText
          }))
          setTranscriptionProgress('Audio processed successfully! ✅')
          setIsTranscribing(false)
        } else if (result.status === 'error') {
          setTranscriptionProgress(`Error: ${result.error || 'Transcription failed'}`)
          setIsTranscribing(false)
        } else if (attempts < maxAttempts) {
          setTimeout(poll, 10000) // Poll every 10 seconds
        } else {
          setTranscriptionProgress('Transcription timeout - please try again')
          setIsTranscribing(false)
        }
      } catch (error) {
        setTranscriptionProgress('Error checking transcription status')
        setIsTranscribing(false)
      }
    }
    
    setTimeout(poll, 2000) // Start polling after 2 seconds
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setAudioFile(file)
      handleAudioUpload(file)
    }
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

  const handleGPSDataChange = (newGpsData: GPSData | null) => {
    setGpsData(newGpsData)
  }

  if (!session) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg">Please log in to create entries.</div>
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
                Create New Entry
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
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
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
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
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
              </div>
            </div>

            {/* Audio Upload Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <h2 className="text-lg font-medium text-gray-900 mb-4">Audio Recording</h2>
              
              {!audioFile ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors">
                  <input
                    type="file"
                    id="audioFile"
                    accept="audio/*,.m4a,.mp3,.wav,.mp4"
                    onChange={handleFileChange}
                    className="hidden"
                    disabled={isUploading || isTranscribing}
                  />
                  <label htmlFor="audioFile" className="cursor-pointer">
                    <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-xl">🎤</span>
                    </div>
                    <p className="text-gray-700 mb-2 font-medium">Upload Voice Recording</p>
                    <p className="text-sm text-gray-500 mb-4">
                      Upload voice memos from your iPhone for automatic transcription and text cleanup
                    </p>
                    <div className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
                      Choose Audio File
                    </div>
                    <p className="text-xs text-gray-400 mt-2">
                      Supports: .m4a, .mp3, .wav, .mp4 (max 50MB)
                    </p>
                  </label>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Audio file info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                          <span className="text-lg">🎵</span>
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{audioFile.name}</p>
                          <p className="text-sm text-gray-500">
                            {(audioFile.size / (1024 * 1024)).toFixed(2)} MB
                          </p>
                        </div>
                      </div>
                      {!isUploading && !isTranscribing && (
                        <button
                          type="button"
                          onClick={() => {
                            setAudioFile(null)
                            setAudioUrl('')
                            setTranscriptionProgress('')
                          }}
                          className="text-red-600 hover:text-red-800 text-sm font-medium"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress indicator */}
                  {(isUploading || isTranscribing || transcriptionProgress) && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        {(isUploading || isTranscribing) && (
                          <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                        )}
                        <div>
                          <p className="text-sm font-medium text-blue-900">
                            {transcriptionProgress}
                          </p>
                          {isTranscribing && (
                            <p className="text-xs text-blue-600 mt-1">
                              This may take a few minutes depending on audio length...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Audio preview (if available) */}
                  {audioUrl && !isUploading && (
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Audio Preview:
                      </label>
                      <audio controls className="w-full">
                        <source src={audioUrl} type="audio/mpeg" />
                        Your browser does not support the audio element.
                      </audio>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Journal Content Section */}
            <div className="bg-white shadow rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-medium text-gray-900">Journal Content</h2>
                {audioFile && formData.content && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Generated from audio
                  </span>
                )}
              </div>
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-2">
                  {audioFile ? 'Review and edit your transcribed content' : 'Write about your day'}
                </label>
                <textarea
                  id="content"
                  name="content"
                  rows={12}
                  required
                  placeholder={audioFile ? 
                    'Your transcribed and cleaned audio content will appear here...' : 
                    'Tell the story of your day... What did you see? How did you feel? What challenges did you face?'
                  }
                  value={formData.content}
                  onChange={handleChange}
                  className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm px-3 py-2 border"
                />
                <div className="mt-2 flex justify-between items-center">
                  <p className="text-sm text-gray-500">
                    {formData.content.length} characters • {formData.content.split(' ').filter(word => word.length > 0).length} words
                  </p>
                  {audioFile && formData.content && (
                    <p className="text-xs text-green-600">
                      ✨ Cleaned up by AI - feel free to edit further!
                    </p>
                  )}
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
                    {gpsData.source === 'manual' ? 'Manual Entry' : 
                     gpsData.source === 'strava' ? 'From Strava' : 'From Garmin'}
                  </span>
                )}
              </div>
              
              <GPSDataInput
                date={formData.date}
                onGPSDataChange={handleGPSDataChange}
                isLoading={isLoading}
              />
              
              {gpsData && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-700">
                    <strong>💡 Route Information:</strong> GPS data helps family members follow your daily progress and adds rich context to your journal entries.
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
                disabled={isLoading || isUploadingPhotos || isTranscribing}
                className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Saving...' : 'Save as Draft'}
              </button>
              <button
                type="submit"
                disabled={isLoading || isUploadingPhotos || isTranscribing}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-md text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? 'Publishing...' : 
                 isUploadingPhotos ? 'Uploading Photos...' :
                 isTranscribing ? 'Processing Audio...' : 
                 'Publish Entry'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  )
}