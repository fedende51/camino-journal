'use client'

import Image from 'next/image'

interface GooglePhotosAlbumPreviewProps {
  albumUrl: string
  coverImageUrl?: string | null
  dayNumber?: number
  className?: string
}

export default function GooglePhotosAlbumPreview({
  albumUrl,
  coverImageUrl,
  dayNumber,
  className = ''
}: GooglePhotosAlbumPreviewProps) {
  const handleClick = () => {
    window.open(albumUrl, '_blank', 'noopener,noreferrer')
  }

  return (
    <div 
      className={`bg-white border border-gray-200 rounded-lg overflow-hidden cursor-pointer hover:shadow-lg transition-shadow duration-200 ${className}`}
      onClick={handleClick}
    >
      {/* Album Cover */}
      <div className="relative aspect-[4/3] bg-gray-100">
        {coverImageUrl ? (
          <Image
            src={coverImageUrl}
            alt={`Photo album ${dayNumber ? `for Day ${dayNumber}` : 'cover'}`}
            fill
            className="object-cover"
          />
        ) : (
          // Standard photo gallery icon fallback
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100">
            <div className="text-center">
              <div className="w-16 h-16 mx-auto mb-2 bg-blue-200 rounded-full flex items-center justify-center">
                <span className="text-3xl">📷</span>
              </div>
              <p className="text-sm text-blue-700 font-medium">Photo Album</p>
            </div>
          </div>
        )}
        
        {/* Overlay */}
        <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-25 transition-all duration-200 flex items-center justify-center">
          <div className="opacity-0 hover:opacity-100 transition-opacity duration-200">
            <div className="bg-white bg-opacity-90 text-gray-900 px-4 py-2 rounded-full font-medium shadow-lg">
              <span className="flex items-center gap-2">
                <span>📸</span>
                View Photos
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Album Info */}
      <div className="p-4">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-gray-900">
              {dayNumber ? `Day ${dayNumber} Photos` : 'Photo Album'}
            </h4>
            <p className="text-sm text-gray-500 mt-1">
              View full album on Google Photos
            </p>
          </div>
          <div className="text-gray-400">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}