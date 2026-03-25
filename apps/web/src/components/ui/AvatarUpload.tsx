import { useState, useRef } from 'react'
import { Camera, Upload, Loader2 } from 'lucide-react'
import { Avatar } from './Avatar'
import { fileUploadService, type UploadedFile } from '../../services/fileUpload'
import styles from '../../styles/modules/ui/AvatarUpload.module.css'

interface AvatarUploadProps {
  currentAvatar?: string
  onUpload: (file: UploadedFile) => void
  size?: number
  type?: 'user' | 'bot' | 'server'
  showButton?: boolean
}

export function AvatarUpload({ currentAvatar, onUpload, size = 128, type = 'user', showButton = true }: AvatarUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [preview, setPreview] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate it's an image
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file')
      return
    }

    // Create preview
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target?.result as string)
    }
    reader.readAsDataURL(file)

    // Upload
    setUploading(true)
    try {
      const uploaded = type === 'bot'
        ? await fileUploadService.uploadBotAvatar(file)
        : await fileUploadService.uploadAvatar(file)

      onUpload(uploaded)
    } catch (error) {
      console.error('Avatar upload failed:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
      setPreview(null)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className={styles.container}>
      <div
        className={styles.avatarWrapper}
        style={{ width: size, height: size, minWidth: size, minHeight: size, maxWidth: '100%', maxHeight: '100%', flexShrink: 0 }}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <div className={styles.uploading}>
            <Loader2 className={styles.spinner} size={size / 3} />
          </div>
        ) : (
          <>
            <img 
              src={preview || currentAvatar || `https://api.dicebear.com/7.x/bottts/svg?seed=user`} 
              alt="Avatar" 
              className={styles.avatar} 
            />
            <div className={styles.overlay}>
              <Camera size={size / 4} />
              <span className={styles.overlayText}>Change</span>
            </div>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        style={{ display: 'none' }}
        disabled={uploading}
      />

      {showButton && (
        <button
          className={styles.uploadButton}
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
        >
          <Upload size={16} />
          {uploading ? 'Uploading...' : 'Upload Photo'}
        </button>
      )}
    </div>
  )
}
