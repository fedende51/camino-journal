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
    const file = formData.get('audio') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No audio file provided' },
        { status: 400 }
      )
    }

    // Validate file type (iPhone voice memos are typically .m4a)
    const allowedTypes = [
      'audio/m4a', 
      'audio/mp4', 
      'audio/mpeg', 
      'audio/mp3',
      'audio/wav',
      'audio/webm'
    ]
    
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB for audio files)
    const maxSize = 50 * 1024 * 1024 // 50MB
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 50MB' },
        { status: 400 }
      )
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop() || 'audio'
    const filename = `audio/${session.user.id}/${timestamp}.${fileExtension}`

    // Upload to Vercel Blob Storage
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: false,
    })

    return NextResponse.json({
      message: 'Audio uploaded successfully',
      url: blob.url,
      filename: blob.pathname,
      size: file.size,
      type: file.type
    })

  } catch (error) {
    console.error('Audio upload error:', error)
    return NextResponse.json(
      { error: 'Failed to upload audio file' },
      { status: 500 }
    )
  }
}