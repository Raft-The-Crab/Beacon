import { useState, useRef, useCallback, useEffect } from 'react'
import { Send, Plus, Smile, Volume2, Image as ImageIcon, X, File, Sparkles, Reply } from 'lucide-react'
import { Button, Tooltip, EmojiPicker, GifPicker, useToast } from '../ui'
import { StickerPicker } from './StickerPicker'
import { fileUploadService, type UploadedFile } from '../../services/fileUpload'
import { MentionPicker } from './MentionPicker'
import { SlashCommandPicker } from './SlashCommandPicker'
import { useInteractionStore } from '../../stores/useInteractionStore'
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
  replyingTo?: ReplyTarget | null
  onCancelReply?: () => void
  isRestricted?: boolean
}

export function MessageInput({
  placeholder = 'Message #general...',
  onSendMessage,
  onStartTyping,
  onStopTyping,
  onVoiceClick,
  replyingTo,
  onCancelReply,
  isRestricted = false,
}: MessageInputProps) {
  const { show } = useToast()
  const MAX_MESSAGE_LENGTH = 2000
  const [message, setMessage] = useState('')
  const [isTyping, setIsTyping] = useState(false)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const [showStickerPicker, setShowStickerPicker] = useState(false)
  const [showGifPicker, setShowGifPicker] = useState(false)
  const [attachments, setAttachments] = useState<UploadedFile[]>([])
  const [uploading, setUploading] = useState(false)
  const [keyboardOffset, setKeyboardOffset] = useState(0)

  // Mention state
  const [showMentionPicker, setShowMentionPicker] = useState(false)
  const [mentionQuery, setMentionQuery] = useState('')
  const [members, setMembers] = useState<any[]>([])

  // Slash command state
  const [showSlashCommandPicker, setShowSlashCommandPicker] = useState(false)
  const [slashCommandQuery, setSlashCommandQuery] = useState('')
  const [activeCommand, setActiveCommand] = useState<any | null>(null)
  const [commandArgs, setCommandArgs] = useState<Record<string, string>>({})
  const [currentOptionIndex, setCurrentOptionIndex] = useState(0)

  const { currentServerId } = useServerStore()

  // Reset members when server changes
  useEffect(() => {
    setMembers([])
  }, [currentServerId])

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

    // Mention detection
    const cursor = e.currentTarget.selectionStart
    const textBeforeCursor = text.slice(0, cursor)
    const lastAtPos = textBeforeCursor.lastIndexOf('@')
    
    // Check if @ is followed by characters without spaces up to the cursor
    if (lastAtPos !== -1 && !textBeforeCursor.slice(lastAtPos).includes(' ')) {
      const query = textBeforeCursor.slice(lastAtPos + 1)
      setMentionQuery(query)
      setShowMentionPicker(true)
      setShowSlashCommandPicker(false)

      // Fetch members if not already cached for THIS server
      if (currentServerId) {
        apiClient.getGuildMembers(currentServerId).then(res => {
          if (res.success && res.data) setMembers(res.data)
        }).catch(err => console.warn('Failed to fetch members for mention:', err))
      }
    } else {
      setShowMentionPicker(false)
      setMentionQuery('')

      // Slash command detection
      if (text.startsWith('/') && !text.includes('\n')) {
        const query = text.slice(1).split(' ')[0]
        setSlashCommandQuery(query)
        setShowSlashCommandPicker(true)
      } else {
        setShowSlashCommandPicker(false)
        setSlashCommandQuery('')
      }
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

  const cancelActiveCommand = () => {
      setActiveCommand(null)
      setCommandArgs({})
      setCurrentOptionIndex(0)
      setMessage('')
      if (textareaRef.current) textareaRef.current.focus()
  }

  const handleSend = () => {
    if (activeCommand) {
        // Execute active command with current args
        const guildId = currentServerId || ''
        const channelId = useUIStore.getState().currentChannelId || ''
        
        // Finalize current message as the last argument if needed
        const options = { ...commandArgs }
        const currentOpt = activeCommand.options?.[currentOptionIndex]
        if (currentOpt && message.trim()) {
            options[currentOpt.name] = message.trim()
        }

        useInteractionStore.getState().executeCommand(channelId, activeCommand.name, options)
        cancelActiveCommand()
        return
    }

    if (message.trim() || attachments.length > 0) {
      // Legacy Slash Command Execution (fallback)
      if (message.startsWith('/') && !message.includes('\n') && !activeCommand) {
        const parts = message.slice(1).split(' ')
        const cmdName = parts[0]
        const argsStr = parts.slice(1).join(' ')
        
        useInteractionStore.getState().executeCommand(
            useUIStore.getState().currentChannelId || '', 
            cmdName, 
            {} 
        )
        
        setMessage('')
        setAttachments([])
        if (textareaRef.current) textareaRef.current.style.height = 'auto'
        return
      }

      onSendMessage(message.trim(), undefined, attachments)
      setMessage('')
      setAttachments([])
      if (textareaRef.current) {
        textareaRef.current.style.height = 'auto'
      }
      setIsTyping(false)
      onStopTyping?.()
      setShowEmojiPicker(false)
      setShowStickerPicker(false)
      setShowGifPicker(false)
      setShowMentionPicker(false)
      setShowSlashCommandPicker(false)
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

  const handleSlashCommandSelect = useCallback((cmd: any) => {
    if (cmd.options?.length > 0) {
        setActiveCommand(cmd)
        setMessage('')
        setCommandArgs({})
        setCurrentOptionIndex(0)
    } else {
        setMessage(`/${cmd.name} `)
    }
    setShowSlashCommandPicker(false)
    setTimeout(() => {
      textareaRef.current?.focus()
    }, 0)
  }, [])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Escape') {
      setShowEmojiPicker(false)
      setShowStickerPicker(false)
      setShowGifPicker(false)
      setShowMentionPicker(false)
      setShowSlashCommandPicker(false)
      return
    }

    if ((showMentionPicker || showSlashCommandPicker) && ['ArrowUp', 'ArrowDown', 'Enter', 'Tab', 'Escape'].includes(e.key)) {
      if (e.key !== 'Escape') e.preventDefault()
      if (e.key === 'Escape') {
        setShowMentionPicker(false)
        setShowSlashCommandPicker(false)
      }
      return
    }

    if (e.key === 'ArrowUp' && message === '' && !showMentionPicker && !showSlashCommandPicker) {
      e.preventDefault()
      const channelMessages = useMessageStore.getState().messages.get(useUIStore.getState().currentChannelId || '') || []
      const lastUserMsg = [...channelMessages].reverse().find(m => m.authorId === 'current-user')
      if (lastUserMsg) {
        useUIStore.getState().setEditingMessage(lastUserMsg.id, lastUserMsg.content)
      }
      return
    }

    if (e.key === 'Backspace' && message === '' && activeCommand) {
        if (currentOptionIndex > 0) {
            const prevOpt = activeCommand.options[currentOptionIndex - 1]
            const prevVal = commandArgs[prevOpt.name]
            setMessage(prevVal)
            setCurrentOptionIndex(currentOptionIndex - 1)
            const newArgs = { ...commandArgs }
            delete newArgs[prevOpt.name]
            setCommandArgs(newArgs)
        } else {
            cancelActiveCommand()
        }
        return
    }

    if (e.key === 'Tab' || e.key === 'Enter') {
        if (activeCommand) {
            const currentOpt = activeCommand.options[currentOptionIndex]
            if (currentOpt && message.trim()) {
                e.preventDefault()
                setCommandArgs({ ...commandArgs, [currentOpt.name]: message.trim() })
                setMessage('')
                if (currentOptionIndex < activeCommand.options.length - 1) {
                    setCurrentOptionIndex(currentOptionIndex + 1)
                } else {
                    handleSend()
                }
                return
            }
        }
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
      const uploaded = await fileUploadService.uploadMultiple(Array.from(files))
      setAttachments([...attachments, ...uploaded])
    } catch (error) {
      show(error instanceof Error ? error.message : 'Upload failed', 'error')
    } finally {
      setUploading(false)
    }
  }

  const handlePaste = async (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items
    if (!items) return

    const imageFiles: File[] = []
    for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
            const file = items[i].getAsFile()
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
        show(error instanceof Error ? error.message : 'Upload failed', 'error')
      } finally {
        setUploading(false)
      }
    }
  }

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index))
  }

  if (isRestricted) {
    return (
      <div className={styles.inputContainer} style={{ '--keyboard-offset': `${keyboardOffset}px` } as any}>
        <div className={`${styles.inputWrapper} ${styles.restrictedWrapper}`}>
          <div className={styles.restrictedMessage}>
            <Sparkles size={18} className={styles.restrictedIcon} />
            <span>{placeholder}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.inputContainer} ref={containerRef} style={{ '--keyboard-offset': `${keyboardOffset}px` } as any}>
      {replyingTo && (
        <div className={styles.replyPreview}>
          <div className={styles.replyBar} />
          <Reply size={14} />
          <span className={styles.replyText}>
            Replying to <span className={styles.replyAuthor}>{replyingTo.authorName}</span>
            {replyingTo.content.substring(0, 80)}{replyingTo.content.length > 80 ? '...' : ''}
          </span>
          <button className={styles.replyClose} onClick={onCancelReply}><X size={14} /></button>
        </div>
      )}

      {attachments.length > 0 && (
        <div className={styles.attachmentPreview}>
          {attachments.map((attachment, index) => (
            <div key={index} className={styles.attachmentItem}>
              {attachment.type?.startsWith('image/') ? (
                <img src={attachment.url} alt="" className={styles.attachmentImage} />
              ) : (
                <div className={styles.attachmentFile}><File size={24} /><span>{attachment.filename}</span></div>
              )}
              <button className={styles.removeAttachment} onClick={() => removeAttachment(index)}><X size={16} /></button>
            </div>
          ))}
        </div>
      )}

      {showMentionPicker && (
        <MentionPicker
          query={mentionQuery}
          members={members.map(m => ({ id: m.user.id, username: m.user.username, displayName: m.nickname, avatar: m.user.avatar }))}
          onSelect={handleMentionSelect}
          onClose={() => setShowMentionPicker(false)}
        />
      )}

      {showSlashCommandPicker && (
        <SlashCommandPicker
          query={slashCommandQuery}
          guildId={currentServerId || undefined}
          onSelect={handleSlashCommandSelect}
          onClose={() => setShowSlashCommandPicker(false)}
        />
      )}

      <div className={styles.inputWrapper}>
        <Tooltip content="Add files" position="top">
          <button type="button" className={styles.iconButton} onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Plus size={20} />
          </button>
        </Tooltip>

        <input ref={fileInputRef} type="file" multiple onChange={handleFileSelect} style={{ display: 'none' }} />

        <div className={styles.textareaWrapper}>
          {activeCommand && (
              <div className={styles.commandModeLayer}>
                  <div className={styles.commandChip}>
                      /{activeCommand.name}
                  </div>
                  {Object.entries(commandArgs).map(([name, val]) => (
                      <div key={name} className={styles.argChip}>
                          <span className={styles.argName}>{name}:</span>
                          <span className={styles.argValue}>{val}</span>
                      </div>
                  ))}
                  {activeCommand.options?.[currentOptionIndex] && (
                      <div className={styles.activeArgHint}>
                          {activeCommand.options[currentOptionIndex].name}:
                      </div>
                  )}
              </div>
          )}
          <textarea
            ref={textareaRef}
            className={`${styles.textarea} ${activeCommand ? styles.commandModeTextarea : ''}`}
            placeholder={activeCommand ? '' : (uploading ? 'Uploading...' : placeholder)}
            value={message}
            onChange={handleInput}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            disabled={uploading}
            maxLength={MAX_MESSAGE_LENGTH}
          />
        </div>

        <div className={styles.actions}>
          <div className={styles.pickerWrapper}>
            <Tooltip content="GIF" position="top">
              <button type="button" ref={gifButtonRef} className={styles.iconButton} onClick={() => setShowGifPicker(!showGifPicker)}><ImageIcon size={20} /></button>
            </Tooltip>
            {showGifPicker && <GifPicker onSelect={handleGifSelect} onClose={() => setShowGifPicker(false)} anchorElement={gifButtonRef.current} />}
          </div>

          <div className={styles.pickerWrapper}>
            <Tooltip content="Emoji" position="top">
              <button type="button" ref={emojiButtonRef} className={styles.iconButton} onClick={() => setShowEmojiPicker(!showEmojiPicker)}><Smile size={20} /></button>
            </Tooltip>
            {showEmojiPicker && <EmojiPicker onSelect={handleEmojiSelect} onClose={() => setShowEmojiPicker(false)} anchorElement={emojiButtonRef.current} />}
          </div>

          <Tooltip content="Sticker" position="top">
            <button type="button" className={`${styles.iconButton} ${styles.magicButton}`} onClick={() => setShowStickerPicker(!showStickerPicker)}><Sparkles size={20} /></button>
          </Tooltip>
          {showStickerPicker && <StickerPicker isOpen={true} onClose={() => setShowStickerPicker(false)} onStickerSelect={handleEmojiSelect} onSuperReaction={() => {}} />}

          {onVoiceClick && (
            <Tooltip content="Voice Message" position="top">
              <button type="button" className={styles.iconButton} onClick={onVoiceClick}>
                <Volume2 size={20} />
              </button>
            </Tooltip>
          )}

          <Button variant="primary" size="md" onClick={handleSend} disabled={!message.trim() && attachments.length === 0} loading={uploading} className={styles.sendButton}>
            <Send size={18} />
          </Button>
        </div>
      </div>
    </div>
  )
}
