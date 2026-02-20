import axios, { AxiosProgressEvent } from 'axios'
import { api } from '../lib/api'

export interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export interface UploadResult {
  url: string
  filename: string
  size: number
  contentType: string
}

export class FileUploadService {
  static async uploadFile(
    file: File,
    onProgress?: (progress: UploadProgress) => void
  ): Promise<UploadResult> {
    const formData = new FormData()
    formData.append('file', file)

    try {
      const response = await api.post('/media/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        },
        onUploadProgress: (progressEvent: AxiosProgressEvent) => {
          if (onProgress && progressEvent.total) {
            const percentage = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress({
              loaded: progressEvent.loaded,
              total: progressEvent.total,
              percentage
            })
          }
        }
      })

      return response.data
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(error.response?.data?.error || 'Upload failed')
      }
      throw error
    }
  }

  static async uploadMultiple(
    files: File[],
    onProgress?: (fileIndex: number, progress: UploadProgress) => void
  ): Promise<UploadResult[]> {
    const uploads = files.map((file, index) =>
      this.uploadFile(file, (progress) => onProgress?.(index, progress))
    )

    return Promise.all(uploads)
  }

  static validateFile(file: File): { valid: boolean; error?: string } {
    const maxSize = 500 * 1024 * 1024 // 500MB
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'video/mp4',
      'video/webm',
      'audio/mpeg',
      'audio/ogg',
      'application/pdf',
      'text/plain'
    ]

    if (file.size > maxSize) {
      return { valid: false, error: 'File size exceeds 500MB limit' }
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File type not supported' }
    }

    return { valid: true }
  }
}
