import { API_BASE_URL } from '../config/endpoints'

// File upload service with image compression and validation

export interface UploadedFile {
  id: string
  filename: string
  size: number
  type: string
  url: string
  thumbnail?: string
}

export interface UploadOptions {
  maxSize?: number // in bytes
  allowedTypes?: string[]
  compress?: boolean
  maxWidth?: number
  maxHeight?: number
}

class FileUploadService {
  private apiUrl: string

  private inferMimeType(resourceType?: string, format?: string): string {
    const ext = (format || '').toLowerCase()
    if (resourceType === 'image') return ext ? `image/${ext === 'jpg' ? 'jpeg' : ext}` : 'image/*'
    if (resourceType === 'video') return ext ? `video/${ext}` : 'video/*'
    if (resourceType === 'raw') {
      if (ext === 'pdf') return 'application/pdf'
      if (ext === 'txt') return 'text/plain'
      return 'application/octet-stream'
    }
    return ext ? `application/${ext}` : 'application/octet-stream'
  }

  constructor(apiUrl: string = API_BASE_URL) {
    this.apiUrl = apiUrl
  }

  async uploadFile(file: File, options: UploadOptions = {}): Promise<UploadedFile> {
    const {
      maxSize = 105 * 1024 * 1024, // 105MB default
      allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*', 'application/*'],
      compress = true,
      maxWidth = 1920,
      maxHeight = 1080,
    } = options

    // Validate file size
    if (file.size > maxSize) {
      throw new Error(`File size exceeds ${maxSize / 1024 / 1024}MB limit`)
    }

    // Validate file type
    const isAllowed = allowedTypes.some((type) => {
      if (type.endsWith('/*')) {
        const category = type.split('/')[0]
        return file.type.startsWith(category)
      }
      return file.type === type
    })

    if (!isAllowed) {
      throw new Error('File type not allowed')
    }

    let fileToUpload = file

    // Compress images
    if (compress && file.type.startsWith('image/')) {
      fileToUpload = await this.compressImage(file, maxWidth, maxHeight)
    }

    // Upload to server
    const formData = new FormData()
    formData.append('file', fileToUpload)

    const token =
      localStorage.getItem('beacon_token') ||
      localStorage.getItem('token') ||
      localStorage.getItem('accessToken')
    const response = await fetch(`${this.apiUrl}/upload`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        ...(token && { Authorization: `Bearer ${token}` }),
      },
      body: formData,
    })

    const data = await response.json().catch(() => ({} as any))

    if (!response.ok) {
      const errorMessage = data?.error || data?.message || 'Upload failed'
      throw new Error(errorMessage)
    }

    const payload = data?.success ? data?.data : data
    const normalized: UploadedFile = {
      id: payload?.id || payload?.public_id || payload?.asset_id || crypto.randomUUID(),
      filename: payload?.filename || payload?.original_filename || fileToUpload.name,
      size: Number(payload?.size ?? payload?.bytes ?? fileToUpload.size ?? file.size ?? 0),
      type: payload?.type || payload?.contentType || payload?.mimeType || this.inferMimeType(payload?.resource_type, payload?.format),
      url: payload?.url || payload?.secure_url || '',
      thumbnail: payload?.thumbnail,
    }

    if (!normalized.url) {
      throw new Error('Upload failed: missing file URL')
    }

    return normalized
  }

  async uploadMultiple(files: File[], options?: UploadOptions): Promise<UploadedFile[]> {
    const uploads = files.map((file) => this.uploadFile(file, options))
    return Promise.all(uploads)
  }

  private compressImage(file: File, maxWidth: number, maxHeight: number): Promise<File> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          let width = img.width
          let height = img.height

          // Calculate new dimensions
          if (width > height) {
            if (width > maxWidth) {
              height *= maxWidth / width
              width = maxWidth
            }
          } else {
            if (height > maxHeight) {
              width *= maxHeight / height
              height = maxHeight
            }
          }

          canvas.width = width
          canvas.height = height

          const ctx = canvas.getContext('2d')
          ctx?.drawImage(img, 0, 0, width, height)

          canvas.toBlob(
            (blob) => {
              if (blob) {
                const compressedFile = new File([blob], file.name, {
                  type: 'image/jpeg',
                  lastModified: Date.now(),
                })
                resolve(compressedFile)
              } else {
                reject(new Error('Compression failed'))
              }
            },
            'image/jpeg',
            0.85
          )
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  // Create thumbnail for images
  async createThumbnail(file: File, size: number = 200): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.readAsDataURL(file)
      reader.onload = (e) => {
        const img = new Image()
        img.src = e.target?.result as string
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = size
          canvas.height = size

          const ctx = canvas.getContext('2d')
          if (!ctx) {
            reject(new Error('Canvas context not available'))
            return
          }

          // Calculate crop
          const scale = Math.max(size / img.width, size / img.height)
          const x = (size - img.width * scale) / 2
          const y = (size - img.height * scale) / 2

          ctx.drawImage(img, x, y, img.width * scale, img.height * scale)

          resolve(canvas.toDataURL('image/jpeg', 0.8))
        }
        img.onerror = reject
      }
      reader.onerror = reject
    })
  }

  // Paste handler for clipboard images
  async handlePaste(event: ClipboardEvent, callback: (files: File[]) => void): Promise<void> {
    const items = event.clipboardData?.items
    if (!items) return

    const files: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) files.push(file)
      }
    }

    if (files.length > 0) {
      event.preventDefault()
      callback(files)
    }
  }

  // Drag and drop handler
  async handleDrop(event: DragEvent, callback: (files: File[]) => void): Promise<void> {
    event.preventDefault()
    const files = Array.from(event.dataTransfer?.files || [])
    if (files.length > 0) {
      callback(files)
    }
  }

  // Upload avatar/profile picture
  async uploadAvatar(file: File): Promise<UploadedFile> {
    return this.uploadFile(file, {
      maxSize: 10 * 1024 * 1024, // 10MB for avatars
      allowedTypes: ['image/*'],
      compress: true,
      maxWidth: 512,
      maxHeight: 512,
    })
  }

  // Upload bot avatar
  async uploadBotAvatar(file: File): Promise<UploadedFile> {
    return this.uploadAvatar(file)
  }

  // Format file size
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  // Get file icon based on type
  getFileIcon(type: string): string {
    if (type.startsWith('image/')) return '🖼️'
    if (type.startsWith('video/')) return '🎬'
    if (type.startsWith('audio/')) return '🎵'
    if (type === 'application/pdf') return '📄'
    if (type.startsWith('text/')) return '📝'
    if (type.includes('zip') || type.includes('rar')) return '📦'
    return '📎'
  }
}

export const fileUploadService = new FileUploadService()
