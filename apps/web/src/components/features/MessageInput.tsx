import { useState, useRef } from 'react'
import { Send, Plus, Smile, Volume2, Image as ImageIcon, X, File, Bot, Sparkles } from 'lucide-react'
import { Button, Tooltip, EmojiPicker, GifPicker, Dropdown } from '../ui'
import { fileUploadService, type UploadedFile } from '../../services/fileUpload'
import styles from './MessageInput.module.css'

interface MessageInputProps {
  placeholder?: string
  onSendMessage: (content: string, gifUrl?: string, attachments?: UploadedFile[], scheduledAt?: string) => void
  onStartTyping?: () => void
  onStopTyping?: () => void
  channels?: { id: string; name: string }[]
  onVoiceClick?: () => void
}

export function MessageInput({
  placeholder = 'Message #general...',
  onSendMessage,
  onStartTyping,
  onStopTyping,
  onVoiceClick,
}: MessageInputProps) {
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [_showScheduleModal, _setShowScheduleModal] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.currentTarget.value
    setMessage(text)

    // Auto-resize textarea
    e.currentTarget.style.height = 'auto'
    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 200)}px`

    // Typing indicator
    if (!isTyping) {
      setIsTyping(true)
      onStartTyping?.()
    }

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false)
      onStopTyping?.()
    }, 3000)
  }

  const handleSend = () => {
    if (message.trim() || attachments.length > 0) {
      const scheduleIso = (scheduledAt && scheduledTime) 
        ? new Date(`${scheduledAt}T${scheduledTime}`).toISOString() 
        : undefined;

      onSendMessage(message.trim(), undefined, attachments, scheduleIso)
      setMessage('')
      setAttachments([])
      setScheduledAt('')
      setScheduledTime('')
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      setIsTyping(false)
      onStopTyping?.()
      setShowEmojiPicker(false)
      setShowGifPicker(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleEmojiSelect = (emoji: string) => {
    const textarea = textareaRef.current
    if (textarea) {
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newMessage = message.slice(0, start) + emoji + message.slice(end)
      setMessage(newMessage)
      
      // Set cursor position after emoji
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + emoji.length
        textarea.focus()
      }, 0)
    } else {
      setMessage(message + emoji)
    }
  }

  const handleGifSelect = (gifUrl: string) => {
    onSendMessage('', gifUrl)
    setShowGifPicker(false)
  }

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    try {
      const uploaded = await fileUploadService.uploadMultiple(Array.from(files), {
        maxSize: 105 * 1024 * 1024, // 105MB
      })
      setAttachments([...attachments, ...uploaded])
    } catch (error) {
      console.error('Upload failed:', error)
      alert(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item.type.startsWith('image/')) {
        const file = item.getAsFile()
        if (file) imageFiles.push(file)
      }
    }

    if (imageFiles.length > 0) {
      e.preventDefault()
      setUploading(true)
      try {
        const uploaded = await fileUploadService.uploadMultiple(imageFiles)
        setAttachments([...attachments, ...uploaded])
      } catch (error) {
        console.error('Upload failed:', error)
        alert(error instanceof Error ? error.message : 'Upload failed')
      } finally {
        setUploading(false)
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  const applyBotAction = (command: string) => {
    setMessage(command)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }

  const botActions = [
    {
      id: 'summarize',
      label: 'Summarize recent chat',
      icon: <Sparkles size={16} />,
      onClick: () => applyBotAction('/bot summarize --recent 50')
    },
    {
      id: 'poll',
      label: 'Create poll',
      icon: <Bot size={16} />,
      onClick: () => applyBotAction('/bot poll "Question" "Option 1" "Option 2"')
    },
    {
      id: 'translate',
      label: 'Translate message',
      icon: <Sparkles size={16} />,
      onClick: () => applyBotAction('/bot translate --to en ""')
    },
    {
      id: 'divider-1',
      label: '',
      divider: true
    },
    {
      id: 'announce',
      label: 'Server announcement',
      icon: <Bot size={16} />,
      onClick: () => applyBotAction('/bot announce ""')
    }
  ]

  return (
    <div className={styles.inputContainer}>
      {attachments.length > 0 && (
        <div className={styles.attachmentPreview}>
          {attachments.map((attachment, index) => (
            <div key={index} className={styles.attachmentItem}>
              {attachment.type.startsWith('image/') ? (
                <img src={attachment.url} alt={attachment.filename} className={styles.attachmentImage} />
              ) : (
                <div className={styles.attachmentFile}>
                  <File size={24} />
                  <span className={styles.attachmentName}>{attachment.filename}</span>
                </div>
              )}
              <button
                className={styles.removeAttachment}
                onClick={() => removeAttachment(index)}
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div className={styles.inputWrapper}>
        <Tooltip content="Add files" position="top">
          <button
            className={styles.iconButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
          >
            <Plus size={20} />
          </button>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileSelect}
          style={{ display: 'none' }}
          accept="*/*"
        />

        <textarea
          ref={textareaRef}
          className={styles.textarea}
          placeholder={uploading ? 'Uploading...' : placeholder}
          value={message}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          rows={1}
          disabled={uploading}
        />

        <div className={styles.actions}>
          <Tooltip content="Bot actions" position="top">
            <div className={styles.dropdownTriggerWrap}>
              <Dropdown
                trigger={<Bot size={20} />}
                items={botActions}
                align="right"
                className={styles.botDropdown}
              />
            </div>
          </Tooltip>

          <div className={styles.pickerWrapper}>
            <Tooltip content="Add GIF" position="top">
              <button 
                className={styles.iconButton}
                onClick={() => {
                  setShowGifPicker(!showGifPicker)
                  setShowEmojiPicker(false)
                }}
              >
                <ImageIcon size={20} />
              </button>
            </Tooltip>
            {showGifPicker && (
              <GifPicker
                onSelect={handleGifSelect}
                onClose={() => setShowGifPicker(false)}
              />
            )}
          </div>

          <div className={styles.pickerWrapper}>
            <Tooltip content="Add emoji" position="top">
              <button 
                className={styles.iconButton}
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker)
                  setShowGifPicker(false)
                }}
              >
                <Smile size={20} />
              </button>
            </Tooltip>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
              />
            )}
          </div>

          {onVoiceClick && (
            <Tooltip content="Send voice message" position="top">
              <button className={styles.iconButton} onClick={onVoiceClick}>
                <Volume2 size={20} />
              </button>
            </Tooltip>
          )}

          <Button
            variant="primary"
            size="md"
            onClick={handleSend}
            disabled={!message.trim() && attachments.length === 0}
            loading={uploading}
            className={styles.sendButton}
          >
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
