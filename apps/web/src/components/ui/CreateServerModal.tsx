import React, { useState } from 'react'
import { AlertCircle, Loader } from 'lucide-react'
import { Modal } from './Modal'
import { SelectDropdown, SelectOption } from './SelectDropdown'
import styles from '../../styles/modules/ui/CreateServerModal.module.css'

interface CreateServerModalProps {
  isOpen: boolean
  onClose: () => void
  onCreate: (serverData: ServerCreationData) => Promise<void> | void
  isLoading?: boolean
}

export interface ServerCreationData {
  name: string
  description?: string
  region: string
  template?: string
  icon?: File | null
}

const REGION_OPTIONS: SelectOption[] = [
  { label: '🌎 US East', value: 'us-east' },
  { label: '🌎 US West', value: 'us-west' },
  { label: '🌍 Europe', value: 'eu-central' },
  { label: '🌏 Asia Pacific', value: 'ap-southeast' },
  { label: '🌎 Brazil', value: 'sa-east' },
]

const TEMPLATE_OPTIONS: SelectOption[] = [
  { label: 'Blank Server', value: 'blank' },
  { label: 'Gaming Community', value: 'gaming' },
  { label: 'Study Group', value: 'study' },
  { label: 'Business Team', value: 'business' },
  { label: 'Creative Studio', value: 'creative' },
  { label: 'Social Club', value: 'social' },
]

export function CreateServerModal({
  isOpen,
  onClose,
  onCreate,
  isLoading = false,
}: CreateServerModalProps) {
  const [formData, setFormData] = useState<ServerCreationData>({
    name: '',
    description: '',
    region: 'us-east',
    template: 'blank',
    icon: null,
  })
  const [error, setError] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    if (file && !file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }
    if (file && file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB')
      return
    }
    setFormData((prev) => ({
      ...prev,
      icon: file,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (!formData.name.trim()) {
      setError('Server name is required')
      return
    }

    if (formData.name.length > 100) {
      setError('Server name must be less than 100 characters')
      return
    }

    setIsSubmitting(true)
    try {
      await onCreate(formData)
      setFormData({
        name: '',
        description: '',
        region: 'us-east',
        template: 'blank',
        icon: null,
      })
      onClose()
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to create server',
      )
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Server"
      size="md"
    >
      <form onSubmit={handleSubmit} className={styles.form}>
        {error && (
          <div className={styles.error}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <div className={styles.fieldGroup}>
          <label htmlFor="name" className={styles.label}>
            Server Name <span className={styles.required}>*</span>
          </label>
          <input
            id="name"
            type="text"
            name="name"
            placeholder="Enter server name"
            required
            maxLength={100}
            className={styles.input}
            value={formData.name}
            onChange={handleChange}
            disabled={isSubmitting || isLoading}
          />
          <p className={styles.helperText}>
            {formData.name.length}/100 characters
          </p>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="description" className={styles.label}>
            Description
          </label>
          <textarea
            id="description"
            name="description"
            placeholder="What's your server about?"
            maxLength={500}
            className={styles.textarea}
            value={formData.description}
            onChange={handleChange}
            disabled={isSubmitting || isLoading}
            rows={4}
          />
          <p className={styles.helperText}>
            {formData.description?.length || 0}/500 characters
          </p>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="template" className={styles.label}>
            Template
          </label>
          <SelectDropdown
            options={TEMPLATE_OPTIONS}
            value={formData.template}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                template: value as string,
              }))
            }
            placeholder="Select a template"
            searchable
          />
          <p className={styles.helperText}>
            Start with a pre-configured template or blank server
          </p>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="region" className={styles.label}>
            Server Region <span className={styles.required}>*</span>
          </label>
          <SelectDropdown
            options={REGION_OPTIONS}
            value={formData.region}
            onChange={(value) =>
              setFormData((prev) => ({
                ...prev,
                region: value as string,
              }))
            }
            placeholder="Select region"
            searchable
          />
          <p className={styles.helperText}>
            Choose the region closest to your users
          </p>
        </div>

        <div className={styles.fieldGroup}>
          <label htmlFor="icon" className={styles.label}>
            Server Icon
          </label>
          <div className={styles.fileInput}>
            <input
              id="icon"
              type="file"
              accept="image/*"
              className={styles.hiddenInput}
              onChange={handleFileChange}
              disabled={isSubmitting || isLoading}
            />
            <label htmlFor="icon" className={styles.fileLabel}>
              {formData.icon
                ? `Selected: ${formData.icon.name}`
                : 'Click to upload or drag and drop'}
            </label>
          </div>
          <p className={styles.helperText}>
            PNG, JPG or GIF (max 10MB)
          </p>
        </div>

        <div className={styles.actions}>
          <button
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
            disabled={isSubmitting || isLoading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={styles.submitBtn}
            disabled={isSubmitting || isLoading || !formData.name.trim()}
          >
            {isSubmitting || isLoading ? (
              <>
                <Loader size={16} className={styles.spinner} />
                Creating...
              </>
            ) : (
              'Create Server'
            )}
          </button>
        </div>
      </form>
    </Modal>
  )
}
