import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Plus, Smile, Volume2, Image as ImageIcon, X, File, Sparkles, Reply } from 'lucide-react'
import { Button, Tooltip, EmojiPicker, GifPicker } from '../ui'
import { StickerPicker } from './StickerPicker'
import { fileUploadService, type UploadedFile } from '../../services/fileUpload'
import { SlashCommandPicker, type SlashCommand } from './SlashCommandPicker'
import { MentionPicker } from './MentionPicker'
import { useServerStore } from '../../stores/useServerStore'
import { useMessageStore } from '../../stores/useMessageStore'
import { useUIStore } from '../../stores/useUIStore'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/features/MessageInput.module.css'

interface ReplyTarget {
  id: string
  authorName: string
  content: string
}

interface MessageInputProps {
  placeholder?: string
  onSendMessage: (content: string, gifUrl?: string, attachments?: UploadedFile[], scheduledAt?: string) => void
  onStartTyping?: () => void
  onStopTyping?: () => void
  channels?: { id: string; name: string }[]
  onVoiceClick?: () => void
  extraSlashCommands?: SlashCommand[]
  replyingTo?: ReplyTarget | null
  onCancelReply?: () => void
}

export function MessageInput({
  placeholder = 'Message #general...',
  onSendMessage,
  onStartTyping,
  onStopTyping,
  onVoiceClick,
  extraSlashCommands = [],
  replyingTo,
  onCancelReply,
}: MessageInputProps) {
  const MAX_MESSAGE_LENGTH = 2000
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [_showScheduleModal, _setShowScheduleModal] = useState(false)
  const [scheduledAt, setScheduledAt] = useState('')
  const [scheduledTime, setScheduledTime] = useState('')
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  // Slash command state
  const [showSlashPicker, setShowSlashPicker] = useState(false)
  const [slashQuery, setSlashQuery] = useState('')

  // Mention state
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [members, setMembers] = useState<any[]>([])

  const { currentServerId } = useServerStore()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gifButtonRef = useRef<HTMLButtonElement>(null)
  const emojiButtonRef = useRef<HTMLButtonElement>(null)
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !window.visualViewport) return

    const vv = window.visualViewport
    const handleViewportChange = () => {
      if (window.innerWidth > 768) {
        setKeyboardOffset(0)
        return
      }

      const delta = Math.max(0, Math.round(window.innerHeight - vv.height - vv.offsetTop))
      const isKeyboardLikelyOpen = delta > 100
      setKeyboardOffset(isKeyboardLikelyOpen ? delta : 0)
    }

    vv.addEventListener('resize', handleViewportChange)
    vv.addEventListener('scroll', handleViewportChange)
    window.addEventListener('orientationchange', handleViewportChange)
    handleViewportChange()

    return () => {
      vv.removeEventListener('resize', handleViewportChange)
      vv.removeEventListener('scroll', handleViewportChange)
      window.removeEventListener('orientationchange', handleViewportChange)
    }
  }, [])

  const handleInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.currentTarget.value.slice(0, MAX_MESSAGE_LENGTH)
    setMessage(text)

    // Auto-resize textarea
    e.currentTarget.style.height = 'auto'
    e.currentTarget.style.height = `${Math.min(e.currentTarget.scrollHeight, 200)}px`

    // Slash command detection: show picker when text starts with "/" and no space yet
    if (text.startsWith('/') && !text.includes(' ')) {
      const query = text.slice(1)
      setSlashQuery(query)
      setShowSlashPicker(true)
      setShowMentionPicker(false)
    } else if (text.startsWith('/') && text.includes(' ')) {
      // Command is finalized, maybe show arg hints?
      setShowSlashPicker(false)
    } else {
      setShowSlashPicker(false)
      setSlashQuery('')
    }

    // Mention detection: show picker when text ends with "@" + query
    const lastAtPos = text.lastIndexOf('@')
    if (lastAtPos !== -1 && !text.slice(lastAtPos).includes(' ')) {
      const query = text.slice(lastAtPos + 1)
      setMentionQuery(query)
      setShowMentionPicker(true)
      setShowSlashPicker(false)

      // Fetch members if not already fetching
      if (members.length === 0 && currentServerId) {
        apiClient.getGuildMembers(currentServerId).then(res => {
          if (res.success && res.data) setMembers(res.data)
        }).catch(err => console.warn('Failed to fetch members for mention:', err))
      }
    } else {
      setShowMentionPicker(false)
      setMentionQuery('')
    }

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

  const handleSlashSelect = useCallback((command: SlashCommand) => {
    // Handle built-in commands inline
    switch (command.name) {
      case 'shrug':
        setMessage(prev => prev.replace(/^\/\S*/, '¯\\_(ツ)_/¯'))
        break
      case 'tableflip':
        setMessage(prev => prev.replace(/^\/\S*/, '(╯°□°）╯︵ ┻━┻'))
        break
      case 'unflip':
        setMessage(prev => prev.replace(/^\/\S*/, '┬─┬ ノ( ゜-゜ノ)'))
        break
      case 'roll': {
        const match = message.match(/^\/roll\s*(\d+)?/)
        const sides = match?.[1] ? Math.min(parseInt(match[1]), 1000) : 6
        const result = Math.floor(Math.random() * sides) + 1
        setMessage(`🎲 Rolled a d${sides}: **${result}**`)
        break
      }
      case 'flip':
        setMessage(Math.random() < 0.5 ? '🪙 Heads!' : '🪙 Tails!')
        break
      case 'rps': {
        const rpChoices = ['🪨 Rock!', '📄 Paper!', '✂️ Scissors!']
        setMessage(rpChoices[Math.floor(Math.random() * rpChoices.length)])
        break
      }
      case 'gif':
        setShowGifPicker(true)
        setMessage('')
        break
      default:
        setMessage('/' + command.name + ' ')
    }
    setShowSlashPicker(false)
    setSlashQuery('')
    setTimeout(() => {
      textareaRef.current?.focus()
      // Move cursor to end
      const ta = textareaRef.current
      if (ta) {
        ta.selectionStart = ta.selectionEnd = ta.value.length
      }
    }, 0)
  }, [])

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
      setShowStickerPicker(false)
      setShowGifPicker(false)
      setShowSlashPicker(false)
      setShowMentionPicker(false)
    }
  }

  const handleMentionSelect = useCallback((member: any) => {
    const textarea = textareaRef.current
    if (!textarea) return

    const cursor = textarea.selectionStart
    const textBefore = message.slice(0, cursor)
    const atPos = textBefore.lastIndexOf('@')

    if (atPos !== -1) {
      const newMessage = message.slice(0, atPos) + `@${member.username} ` + message.slice(cursor)
      setMessage(newMessage)
      setShowMentionPicker(false)
      setMentionQuery('')

      setTimeout(() => {
        textarea.focus()
        const newPos = atPos + member.username.length + 2
        textarea.selectionStart = textarea.selectionEnd = newPos
      }, 0)
    }
  }, [message])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setShowEmojiPicker(false)
      setShowStickerPicker(false)
      setShowGifPicker(false)
      setShowSlashPicker(false)
      setShowMentionPicker(false)
      return
    }

    // If either picker is open, let it consume navigation keys
    if ((showSlashPicker || showMentionPicker) && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      if (e.key !== 'Escape') e.preventDefault()
      if (e.key === 'Escape') {
        setShowSlashPicker(false)
        setShowMentionPicker(false)
      }
      return
    }
    if (e.key === 'ArrowUp' && message === '' && !showSlashPicker && !showMentionPicker) {
      e.preventDefault()
      // Find the last message sent by the current user in this channel
      const channelMessages = useMessageStore.getState().messages.get(useUIStore.getState().currentChannelId || '') || []
      const lastUserMsg = [...channelMessages].reverse().find(m => m.authorId === 'current-user')
      if (lastUserMsg) {
        // We need a way to trigger editing from here. 
        // Typically this would be a store action or a prop callback.
        // For now, let's assume ChatArea handles the actual editing state, 
        // but we can at least signal it or use a global store if available.
        // Since useMessageStore is already imported (implied), we can use a custom hook or action.
        useUIStore.getState().setEditingMessage(lastUserMsg.id, lastUserMsg.content)
      }
      return
    }
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

  return (
    <div
      className={styles.inputContainer}
      ref={containerRef}
      style={{ '--keyboard-offset': `${keyboardOffset}px` } as React.CSSProperties}
    >
      {/* Reply preview bar */}
      {replyingTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyBar} />
          <Reply size={14} />
          <span className={styles.replyText}>
            Replying to <span className={styles.replyAuthor}>{replyingTo.authorName}</span>
            {replyingTo.content.substring(0, 80)}{replyingTo.content.length > 80 ? '...' : ''}
          </span>
          <button className={styles.replyClose} onClick={onCancelReply}>
            <X size={14} />
          </button>
        </div>
      )}

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

      {/* Mention Picker */}
      {showMentionPicker && (
        <MentionPicker
          query={mentionQuery}
          members={members.map(m => ({
            id: m.user.id,
            username: m.user.username,
            displayName: m.nickname,
            avatar: m.user.avatar
          }))}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentionPicker(false)}
        />
      )}

      {/* Slash Command Picker — floats above the input */}
      {showSlashPicker && (
        <SlashCommandPicker
          query={slashQuery}
          onSelect={handleSlashSelect}
          onClose={() => setShowSlashPicker(false)}
          anchorRef={containerRef as React.RefObject<HTMLElement>}
          extraCommands={extraSlashCommands}
        />
      )}

      <div className={styles.inputWrapper}>
        <Tooltip content="Add files" position="top">
          <button
            type="button"
            className={styles.iconButton}
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            aria-label="Add files"
          >
            <Plus size={20} />
          </button>
        </Tooltip>

        <input
          ref={fileInputRef}
          type="file"
          multiple
          onClick={(e) => { (e.currentTarget as HTMLInputElement).value = '' }}
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
          maxLength={MAX_MESSAGE_LENGTH}
        />

        <div className={styles.actions}>
          <div className={styles.pickerWrapper}>
            <Tooltip content="Add GIF" position="top">
              <button
                type="button"
                ref={gifButtonRef}
                className={styles.iconButton}
                onClick={() => {
                  setShowGifPicker(!showGifPicker)
                  setShowEmojiPicker(false)
                }}
                aria-label="Add GIF"
              >
                <ImageIcon size={20} />
              </button>
            </Tooltip>
            {showGifPicker && (
              <GifPicker
                onSelect={handleGifSelect}
                onClose={() => setShowGifPicker(false)}
                anchorElement={gifButtonRef.current}
              />
            )}
          </div>

          <div className={styles.pickerWrapper}>
            <Tooltip content="Add emoji" position="top">
              <button
                type="button"
                ref={emojiButtonRef}
                className={styles.iconButton}
                onClick={() => {
                  setShowEmojiPicker(!showEmojiPicker)
                  setShowGifPicker(false)
                }}
                aria-label="Add emoji"
              >
                <Smile size={20} />
              </button>
            </Tooltip>
            {showEmojiPicker && (
              <EmojiPicker
                onSelect={handleEmojiSelect}
                onClose={() => setShowEmojiPicker(false)}
                anchorElement={emojiButtonRef.current}
              />
            )}
          </div>

          <div className={styles.pickerWrapper}>
            <Tooltip content="Add sticker" position="top">
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => {
                  setShowStickerPicker(!showStickerPicker)
                  setShowEmojiPicker(false)
                  setShowGifPicker(false)
                }}
                aria-label="Add sticker"
              >
                <Sparkles size={20} />
              </button>
            </Tooltip>
            {showStickerPicker && (
              <StickerPicker
                isOpen={showStickerPicker}
                onClose={() => setShowStickerPicker(false)}
                onStickerSelect={(emoji) => handleEmojiSelect(emoji)}
                onSuperReaction={() => { }}
              />
            )}
          </div>

          {onVoiceClick && (
            <Tooltip content="Send voice message" position="top">
              <button type="button" className={styles.iconButton} onClick={onVoiceClick} aria-label="Send voice message">
                <Volume2 size={20} />
              </button>
            </Tooltip>
          )}

          {message.length >= 1600 && (
            <span className={`${styles.charCount} ${message.length >= MAX_MESSAGE_LENGTH ? styles.charCountLimit : ''}`}>
              {message.length}/{MAX_MESSAGE_LENGTH}
            </span>
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
