import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { TranscriptionService } from '@/lib/services/transcription'
import { TextCleanupService } from '@/lib/services/textCleanup'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const { audioUrl, entryId, context } = await request.json()
    
    if (!audioUrl) {
      return NextResponse.json(
        { error: 'Audio URL is required' },
        { status: 400 }
      )
    }

    // Start transcription
    const transcriptionResult = await TranscriptionService.transcribeAudio(audioUrl)
    
    if (transcriptionResult.status === 'error') {
      return NextResponse.json(
        { error: transcriptionResult.error || 'Transcription failed' },
        { status: 500 }
      )
    }

    // If transcription completed, clean up the text
    let cleanedText = ''
    if (transcriptionResult.status === 'completed' && transcriptionResult.text) {
      try {
        const cleanupResult = await TextCleanupService.cleanupText(
          transcriptionResult.text,
          context
        )
        cleanedText = cleanupResult.cleanedText
      } catch (error) {
        console.error('Text cleanup failed, using raw transcription:', error)
        cleanedText = TextCleanupService.formatText(transcriptionResult.text)
      }
    }

    // If entryId provided, save audio file record to database
    if (entryId && transcriptionResult.status === 'completed') {
      try {
        await prisma.audioFile.create({
          data: {
            entryId,
            blobUrl: audioUrl,
            filename: audioUrl.split('/').pop() || 'audio.m4a',
            transcription: transcriptionResult.text,
            processed: true
          }
        })
      } catch (error) {
        console.error('Failed to save audio file record:', error)
        // Don't fail the request if database save fails
      }
    }

    return NextResponse.json({
      transcriptionId: transcriptionResult.id,
      status: transcriptionResult.status,
      originalText: transcriptionResult.text,
      cleanedText,
      confidence: transcriptionResult.confidence,
      audioDuration: transcriptionResult.audio_duration
    })

  } catch (error) {
    console.error('Transcription API error:', error)
    return NextResponse.json(
      { error: 'Transcription failed' },
      { status: 500 }
    )
  }
}

// GET endpoint to check transcription status
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'PILGRIM') {
      return NextResponse.json(
        { error: 'Unauthorized - Pilgrim access required' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const transcriptionId = searchParams.get('id')
    
    if (!transcriptionId) {
      return NextResponse.json(
        { error: 'Transcription ID is required' },
        { status: 400 }
      )
    }

    const result = await TranscriptionService.getTranscription(transcriptionId)
    
    // If completed, also clean up the text
    let cleanedText = ''
    if (result.status === 'completed' && result.text) {
      try {
        const cleanupResult = await TextCleanupService.cleanupText(result.text)
        cleanedText = cleanupResult.cleanedText
      } catch (error) {
        console.error('Text cleanup failed:', error)
        cleanedText = TextCleanupService.formatText(result.text)
      }
    }

    return NextResponse.json({
      transcriptionId: result.id,
      status: result.status,
      originalText: result.text,
      cleanedText,
      confidence: result.confidence,
      audioDuration: result.audio_duration,
      error: result.error
    })

  } catch (error) {
    console.error('Get transcription error:', error)
    return NextResponse.json(
      { error: 'Failed to get transcription status' },
      { status: 500 }
    )
  }
}