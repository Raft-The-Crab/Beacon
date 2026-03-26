import { apiClient } from '../services/apiClient'

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
    const res = await apiClient.uploadFile('/media/upload', file, onProgress);
    
    if (res.success) {
      return res.data;
    } else {
      throw new Error(res.error || 'Upload failed');
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
