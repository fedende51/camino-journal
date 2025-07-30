export interface PhotoProcessingOptions {
  maxWidth?: number
  maxHeight?: number
  quality?: number
  format?: 'jpeg' | 'webp' | 'png'
}

export interface ProcessedPhoto {
  file: File
  originalSize: number
  compressedSize: number
  compressionRatio: number
  width: number
  height: number
}

export class PhotoProcessor {
  /**
   * Compress and optimize image file for upload
   */
  static async compressImage(
    file: File, 
    options: PhotoProcessingOptions = {}
  ): Promise<ProcessedPhoto> {
    const {
      maxWidth = 1920,
      maxHeight = 1080,
      quality = 0.8,
      format = 'jpeg'
    } = options

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      const img = new Image()

      if (!ctx) {
        reject(new Error('Canvas context not available'))
        return
      }

      img.onload = () => {
        // Calculate new dimensions while maintaining aspect ratio
        let { width, height } = img
        
        if (width > maxWidth || height > maxHeight) {
          const aspectRatio = width / height
          
          if (width > height) {
            width = maxWidth
            height = width / aspectRatio
          } else {
            height = maxHeight
            width = height * aspectRatio
          }
        }

        // Set canvas dimensions
        canvas.width = width
        canvas.height = height

        // Draw and compress image
        ctx.drawImage(img, 0, 0, width, height)

        // Convert to blob
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'))
              return
            }

            // Create new file from blob
            const compressedFile = new File(
              [blob], 
              file.name.replace(/\.[^/.]+$/, `.${format === 'jpeg' ? 'jpg' : format}`),
              { 
                type: `image/${format === 'jpeg' ? 'jpeg' : format}`,
                lastModified: Date.now()
              }
            )

            resolve({
              file: compressedFile,
              originalSize: file.size,
              compressedSize: blob.size,
              compressionRatio: Math.round((1 - blob.size / file.size) * 100),
              width: Math.round(width),
              height: Math.round(height)
            })
          },
          `image/${format}`,
          quality
        )
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
      }

      // Create object URL and load image
      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Create thumbnail version of image
   */
  static async createThumbnail(
    file: File,
    size: number = 300
  ): Promise<ProcessedPhoto> {
    return this.compressImage(file, {
      maxWidth: size,
      maxHeight: size,
      quality: 0.7,
      format: 'jpeg'
    })
  }

  /**
   * Validate image file
   */
  static validateImageFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
    const maxSize = 10 * 1024 * 1024 // 10MB

    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      }
    }

    if (file.size > maxSize) {
      return {
        isValid: false,
        error: 'File too large. Maximum size is 10MB'
      }
    }

    return { isValid: true }
  }

  /**
   * Extract EXIF data from image (basic implementation)
   */
  static async extractImageInfo(file: File): Promise<{
    width: number
    height: number
    size: number
    type: string
  }> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      img.onload = () => {
        resolve({
          width: img.naturalWidth,
          height: img.naturalHeight,
          size: file.size,
          type: file.type
        })
        URL.revokeObjectURL(img.src)
      }

      img.onerror = () => {
        reject(new Error('Failed to load image'))
        URL.revokeObjectURL(img.src)
      }

      img.src = URL.createObjectURL(file)
    })
  }

  /**
   * Convert HEIC/HEIF files to JPEG (placeholder - would need external library)
   */
  static async convertHeicToJpeg(file: File): Promise<File> {
    // For now, return original file
    // In production, you'd use a library like heic2any
    console.warn('HEIC conversion not implemented - returning original file')
    return file
  }
}