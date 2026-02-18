import { useState, useRef } from 'react'
import { Upload, X, File, Image as ImageIcon, Loader } from 'lucide-react'
import { fileUploadService, type UploadedFile } from '../../services/fileUpload'
import { Button } from './Button'
import styles from './FileUpload.module.css'

interface FileUploadProps {
  onUpload: (files: UploadedFile[]) => void
  maxFiles?: number
  maxSize?: number
  allowedTypes?: string[]
  multiple?: boolean
  showPreview?: boolean
}

export function FileUpload({
  onUpload,
  maxFiles = 10,
  maxSize = 10 * 1024 * 1024,
  allowedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/*'],
  multiple = true,
  showPreview = true,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([])
  const [previews, setPreviews] = useState<string[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (selectedFiles: FileList | null) => {
    if (!selectedFiles) return

    const newFiles = Array.from(selectedFiles).slice(0, maxFiles - files.length)
    
    // Generate previews for images
    const newPreviews: string[] = []
    for (const file of newFiles) {
      if (file.type.startsWith('image/')) {
        try {
          const preview = await fileUploadService.createThumbnail(file, 150)
          newPreviews.push(preview)
        } catch {
          newPreviews.push('')
        }
      } else {
        newPreviews.push('')
      }
    }

    setFiles([...files, ...newFiles])
    setPreviews([...previews, ...newPreviews])
  }

  const handleUpload = async () => {
    if (files.length === 0) return

    setUploading(true)
    try {
      const uploaded = await fileUploadService.uploadMultiple(files, {
        maxSize,
        allowedTypes,
      })
      onUpload(uploaded)
      setFiles([])
      setPreviews([])
    } catch (error) {
      console.error('Upload failed:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index))
    setPreviews(previews.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    handleFileSelect(e.dataTransfer.files)
  }

  return (
    <div className={styles.container}>
      <div
        className={`${styles.dropzone} ${dragOver ? styles.dragOver : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <Upload size={32} className={styles.uploadIcon} />
        <p className={styles.dropText}>
          <strong>Click to upload</strong> or drag and drop
        </p>
        <p className={styles.dropHint}>
          Max {maxFiles} files, up to {fileUploadService.formatFileSize(maxSize)} each
        </p>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        multiple={multiple}
        accept={allowedTypes.join(',')}
        onChange={(e) => handleFileSelect(e.target.files)}
        style={{ display: 'none' }}
      />

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((file, index) => (
            <div key={index} className={styles.fileItem}>
              {showPreview && previews[index] ? (
                <img src={previews[index]} alt={file.name} className={styles.preview} />
              ) : (
                <div className={styles.fileIcon}>
                  {file.type.startsWith('image/') ? (
                    <ImageIcon size={24} />
                  ) : (
                    <File size={24} />
                  )}
                </div>
              )}
              <div className={styles.fileInfo}>
                <p className={styles.fileName}>{file.name}</p>
                <p className={styles.fileSize}>
                  {fileUploadService.formatFileSize(file.size)}
                </p>
              </div>
              <button
                className={styles.removeButton}
                onClick={() => removeFile(index)}
                disabled={uploading}
              >
                <X size={18} />
              </button>
            </div>
          ))}
        </div>
      )}

      {files.length > 0 && (
        <div className={styles.actions}>
          <Button
            variant="secondary"
            onClick={() => {
              setFiles([])
              setPreviews([])
            }}
            disabled={uploading}
          >
            Clear All
          </Button>
          <Button
            variant="primary"
            onClick={handleUpload}
            disabled={uploading}
            loading={uploading}
          >
            {uploading ? (
              <>
                <Loader className={styles.spinner} size={18} />
                Uploading...
              </>
            ) : (
              `Upload ${files.length} file${files.length > 1 ? 's' : ''}`
            )}
          </Button>
        </div>
      )}
    </div>
  )
}
