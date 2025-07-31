'use client'

import { useState, useRef } from 'react'
import { PhotoProcessor, ProcessedPhoto } from '@/lib/services/photoProcessor'

interface Photo {
  id: string
  file: File
  url: string
  isHero: boolean
  processed?: ProcessedPhoto
}

interface PhotoGalleryProps {
  photos: Photo[]
  onPhotosChange: (photos: Photo[]) => void
  onUploadStart?: () => void
  onUploadComplete?: (urls: string[]) => void
  onUploadError?: (error: string) => void
  isUploading?: boolean
}

export default function PhotoGallery({
  photos,
  onPhotosChange,
  onUploadStart,
  onUploadComplete,
  onUploadError,
  isUploading = false
}: PhotoGalleryProps) {
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (files: FileList) => {
    if (files.length === 0) return

    setIsProcessing(true)
    const newPhotos: Photo[] = []

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        
        // Validate file
        const validation = PhotoProcessor.validateImageFile(file)
        if (!validation.isValid) {
          onUploadError?.(validation.error || 'Invalid file')
          continue
        }

        // Compress image
        const processed = await PhotoProcessor.compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 0.85,
          format: 'jpeg'
        })

        const photo: Photo = {
          id: `${Date.now()}-${i}`,
          file: processed.file,
          url: URL.createObjectURL(processed.file),
          isHero: photos.length === 0 && i === 0, // First photo of first upload is hero
          processed
        }

        newPhotos.push(photo)
      }

      onPhotosChange([...photos, ...newPhotos])
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Failed to process images')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleFileSelect(e.target.files)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    if (e.dataTransfer.files) {
      handleFileSelect(e.dataTransfer.files)
    }
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const removePhoto = (photoId: string) => {
    const updatedPhotos = photos.filter(p => p.id !== photoId)
    
    // If we removed the hero photo, make the first remaining photo the hero
    if (updatedPhotos.length > 0 && !updatedPhotos.some(p => p.isHero)) {
      updatedPhotos[0].isHero = true
    }
    
    onPhotosChange(updatedPhotos)
  }

  const setHeroPhoto = (photoId: string) => {
    const updatedPhotos = photos.map(photo => ({
      ...photo,
      isHero: photo.id === photoId
    }))
    onPhotosChange(updatedPhotos)
  }

  const uploadPhotos = async () => {
    if (photos.length === 0) return

    onUploadStart?.()

    try {
      const formData = new FormData()
      photos.forEach(photo => {
        formData.append('photos', photo.file)
      })

      const response = await fetch('/api/upload/photos', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Upload failed')
      }

      const data = await response.json()
      onUploadComplete?.(data.photos.map((p: any) => p.url))
    } catch (error) {
      onUploadError?.(error instanceof Error ? error.message : 'Upload failed')
    }
  }

  return (
    <div className="space-y-4">
      {/* Upload Area */}
      {photos.length === 0 ? (
        <div
          className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current?.click()}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing || isUploading}
          />
          
          <div className="w-12 h-12 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-xl">📸</span>
          </div>
          
          <p className="text-gray-700 mb-2 font-medium">Upload Photos</p>
          <p className="text-sm text-gray-500 mb-4">
            Drag and drop photos here or click to browse
          </p>
          
          <div className="inline-flex items-center px-4 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100">
            Choose Photos
          </div>
          
          <p className="text-xs text-gray-400 mt-2">
            Supports: JPEG, PNG, WebP, HEIC (max 10MB each, 10 photos max)
          </p>
        </div>
      ) : (
        <>
          {/* Photo Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {photos.map((photo) => (
              <div key={photo.id} className="relative group">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={photo.url}
                    alt="Uploaded photo"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Hero Badge */}
                {photo.isHero && (
                  <div className="absolute top-2 left-2 bg-yellow-500 text-white px-2 py-1 rounded-full text-xs font-medium">
                    Hero
                  </div>
                )}
                
                {/* Photo Actions */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <div className="flex space-x-2">
                    {!photo.isHero && (
                      <button
                        onClick={() => setHeroPhoto(photo.id)}
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm font-medium"
                        disabled={isProcessing || isUploading}
                      >
                        Set Hero
                      </button>
                    )}
                    <button
                      onClick={() => removePhoto(photo.id)}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm font-medium"
                      disabled={isProcessing || isUploading}
                    >
                      Remove
                    </button>
                  </div>
                </div>
                
                {/* Processing Info */}
                {photo.processed && (
                  <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white px-2 py-1 rounded text-xs">
                    {photo.processed.compressionRatio}% smaller
                  </div>
                )}
              </div>
            ))}
            
            {/* Add More Button */}
            {photos.length < 10 && (
              <div
                className="aspect-square border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center cursor-pointer hover:border-gray-400 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="text-center">
                  <div className="w-8 h-8 mx-auto mb-2 bg-gray-100 rounded-full flex items-center justify-center">
                    <span className="text-lg">+</span>
                  </div>
                  <p className="text-sm text-gray-500">Add More</p>
                </div>
              </div>
            )}
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={isProcessing || isUploading}
          />
          
          {/* Photo Stats */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">
                  <strong>{photos.length}</strong> photos selected
                </span>
                {photos.length > 0 && (
                  <span className="text-gray-500">
                    Hero: {photos.find(p => p.isHero)?.file.name.substring(0, 20)}...
                  </span>
                )}
              </div>
              <div className="text-gray-500">
                Total size: {Math.round(photos.reduce((sum, p) => sum + p.file.size, 0) / (1024 * 1024))} MB
              </div>
            </div>
          </div>
        </>
      )}
      
      {/* Processing/Upload Status */}
      {(isProcessing || isUploading) && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
            <div>
              <p className="text-sm font-medium text-blue-900">
                {isProcessing ? 'Processing images...' : 'Uploading photos...'}
              </p>
              {isProcessing && (
                <p className="text-xs text-blue-600 mt-1">
                  Compressing and optimizing for faster upload...
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}