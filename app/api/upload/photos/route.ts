import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { put } from '@vercel/blob'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const formData = await request.formData()
    const files = formData.getAll('photos') as File[]
    
    if (!files || files.length === 0) {
      return NextResponse.json(
        { error: 'No photo files provided' },
        { status: 400 }
      )
    }

    // Validate file types and sizes
    const allowedTypes = [
      'image/jpeg',
      'image/jpg', 
      'image/png',
      'image/webp',
      'image/heic',
      'image/heif'
    ]
    
    const maxSize = 10 * 1024 * 1024 // 10MB per image
    const maxFiles = 10 // Maximum 10 photos per upload
    
    if (files.length > maxFiles) {
      return NextResponse.json(
        { error: `Maximum ${maxFiles} photos allowed per upload` },
        { status: 400 }
      )
    }
    
    const uploadPromises = files.map(async (file, index) => {
      // Validate file type
      if (!allowedTypes.includes(file.type)) {
        throw new Error(`Invalid file type for ${file.name}. Allowed types: ${allowedTypes.join(', ')}`)
      }

      // Validate file size
      if (file.size > maxSize) {
        throw new Error(`File ${file.name} is too large. Maximum size is 10MB`)
      }

      // Generate unique filename
      const timestamp = Date.now()
      const fileExtension = file.name.split('.').pop() || 'jpg'
      const filename = `photos/${session.user.id}/${timestamp}-${index}.${fileExtension}`

      // Upload to Vercel Blob Storage
      const blob = await put(filename, file, {
        access: 'public',
        addRandomSuffix: false,
      })

      return {
        url: blob.url,
        filename: blob.pathname,
        originalName: file.name,
        size: file.size,
        type: file.type
      }
    })

    const uploadResults = await Promise.all(uploadPromises)

    return NextResponse.json({
      message: `${uploadResults.length} photos uploaded successfully`,
      photos: uploadResults
    })

  } catch (error) {
    console.error('Photo upload error:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload photos' },
      { status: 500 }
    )
  }
}