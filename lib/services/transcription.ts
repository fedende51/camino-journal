import { AssemblyAI } from 'assemblyai'

const client = new AssemblyAI({
  apiKey: process.env.ASSEMBLYAI_API_KEY!,
})

export interface TranscriptionResult {
  id: string
  text: string
  status: 'queued' | 'processing' | 'completed' | 'error'
  confidence?: number
  audio_duration?: number
  error?: string
}

export class TranscriptionService {
  /**
   * Start transcription of an audio file
   */
  static async transcribeAudio(audioUrl: string): Promise<TranscriptionResult> {
    try {
      if (!process.env.ASSEMBLYAI_API_KEY) {
        throw new Error('AssemblyAI API key not configured')
      }

      const transcript = await client.transcripts.transcribe({
        audio: audioUrl,
        language_code: 'en', // Can be changed to 'es' for Spanish
        punctuate: true,
        format_text: true,
        dual_channel: false,
        speaker_labels: false, // Single speaker expected
        auto_chapters: false,
        auto_highlights: false,
        content_safety: false,
        iab_categories: false,
        language_detection: false,
        redact_pii: false,
        redact_pii_audio: false,
        redact_pii_policies: [],
        redact_pii_sub: 'hash',
        sentiment_analysis: false,
        summarization: false,
        summary_model: 'informative',
        summary_type: 'bullets',
        custom_spelling: [],
      })

      if (transcript.status === 'error') {
        return {
          id: transcript.id,
          text: '',
          status: 'error',
          error: transcript.error || 'Transcription failed'
        }
      }

      return {
        id: transcript.id,
        text: transcript.text || '',
        status: transcript.status as TranscriptionResult['status'],
        confidence: transcript.confidence || undefined,
        audio_duration: transcript.audio_duration || undefined
      }

    } catch (error) {
      console.error('Transcription error:', error)
      throw new Error(`Transcription failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Get transcription status and result
   */
  static async getTranscription(transcriptId: string): Promise<TranscriptionResult> {
    try {
      const transcript = await client.transcripts.get(transcriptId)

      if (transcript.status === 'error') {
        return {
          id: transcript.id,
          text: '',
          status: 'error',
          error: transcript.error || 'Transcription failed'
        }
      }

      return {
        id: transcript.id,
        text: transcript.text || '',
        status: transcript.status as TranscriptionResult['status'],
        confidence: transcript.confidence || undefined,
        audio_duration: transcript.audio_duration || undefined
      }

    } catch (error) {
      console.error('Get transcription error:', error)
      throw new Error(`Failed to get transcription: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  /**
   * Delete a transcript (cleanup)
   */
  static async deleteTranscription(transcriptId: string): Promise<void> {
    try {
      await client.transcripts.delete(transcriptId)
    } catch (error) {
      console.error('Delete transcription error:', error)
      // Don't throw error for cleanup operations
    }
  }
}