import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
})

export interface TextCleanupResult {
  originalText: string
  cleanedText: string
  wordCount: number
  processingTime: number
}

export class TextCleanupService {
  /**
   * Clean up and format transcribed text for journal entry
   */
  static async cleanupText(transcribedText: string, context?: {
    location?: string
    dayNumber?: number
    date?: string
  }): Promise<TextCleanupResult> {
    const startTime = Date.now()

    try {
      if (!process.env.ANTHROPIC_API_KEY) {
        throw new Error('Anthropic API key not configured')
      }

      if (!transcribedText.trim()) {
        throw new Error('No text provided for cleanup')
      }

      // Build context information for better cleanup
      let contextInfo = ''
      if (context) {
        contextInfo = `
Context for this journal entry:
- Day: ${context.dayNumber || 'Unknown'}
- Date: ${context.date || 'Unknown'}
- Location: ${context.location || 'Unknown'}
        `.trim()
      }

      const prompt = `You are helping a Camino de Santiago pilgrim clean up their voice-recorded journal entry. 

${contextInfo}

Please clean up this transcribed journal entry while maintaining the personal voice and authentic style. Your tasks:

1. Fix grammatical errors and add appropriate punctuation
2. Organize into readable paragraphs where natural breaks occur
3. Preserve all factual information, personal details, and emotions
4. Keep the tone conversational and authentic - don't make it too formal
5. Fix obvious transcription errors while preserving the pilgrim's unique voice
6. Don't add information that wasn't in the original
7. Keep the same approximate length and detail level

Original transcribed text:
"${transcribedText}"

Please return only the cleaned-up journal entry text, nothing else.`

      const response = await anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 2000,
        temperature: 0.3, // Lower temperature for more consistent cleanup
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })

      const cleanedText = response.content[0].type === 'text' 
        ? response.content[0].text.trim()
        : transcribedText // Fallback to original if response format is unexpected

      const processingTime = Date.now() - startTime

      return {
        originalText: transcribedText,
        cleanedText,
        wordCount: cleanedText.split(/\s+/).length,
        processingTime
      }

    } catch (error) {
      console.error('Text cleanup error:', error)
      
      // Fallback: return original text if cleanup fails
      return {
        originalText: transcribedText,
        cleanedText: transcribedText,
        wordCount: transcribedText.split(/\s+/).length,
        processingTime: Date.now() - startTime
      }
    }
  }

  /**
   * Simple text formatting without AI (fallback)
   */
  static formatText(text: string): string {
    return text
      // Fix common transcription issues
      .replace(/\bi\b/g, 'I') // Lowercase i to uppercase I
      .replace(/\b(camino|santiago)\b/gi, (match) => 
        match.charAt(0).toUpperCase() + match.slice(1).toLowerCase()
      )
      // Add proper punctuation at sentence ends
      .replace(/([.!?])\s+/g, '$1 ')
      // Clean up multiple spaces
      .replace(/\s+/g, ' ')
      // Trim whitespace
      .trim()
  }
}