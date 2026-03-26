import React, { useRef, useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { Smile, Edit, Trash2, File, Pin, Shield, Languages, Flag, Download, Check, Volume2, MoreVertical } from 'lucide-react'
import type { UserBadge } from 'beacon-sdk'
import { Avatar, Tooltip, EmojiPicker, ImageLightbox, Select } from '../ui'
import { BotTag } from '../ui/UserBadges'
import { CustomUsername } from '../ui/CustomUsername'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUIStore } from '../../stores/useUIStore'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { useProfileArtStore } from '../../stores/useProfileArtStore'
import { CustomVideoPlayer, CustomAudioPlayer } from './MediaPlayers'
import { resolveAssetUrl } from '../../config/endpoints'
import styles from '../../styles/modules/features/MessageItem.module.css'

export interface MessageReaction {
  emoji: string
  count: number
  userReacted: boolean
  isSuper?: boolean
}

interface MessageItemProps {
  id: string
  authorId?: string
  authorName: string
  authorDisplayName?: string
  authorIsBeaconPlus?: boolean
  authorAvatar?: string
  authorBanner?: string
  authorStatus?: 'online' | 'idle' | 'dnd' | 'offline'
  authorCustomStatus?: string
  authorBio?: string
  authorJoinedAt?: string
  authorRoles?: { name: string; color: string }[]
  authorAvatarDecorationId?: string | null
  authorProfileEffectId?: string | null
  authorNameDesign?: any
  moderationUserId?: string
  content: string
  timestamp: string
  edited?: boolean
  reactions?: MessageReaction[]
  attachments?: any[]
  components?: any[]
  canDelete?: boolean
  canEdit?: boolean
  isPinned?: boolean
  onReaction?: (emoji: string, isSuper?: boolean) => void
  onDelete?: () => void
  onEdit?: () => void
  onPin?: () => void
  onReportMessage?: () => void
  onReportUser?: () => void
  onComponentInteraction?: (component: any, values?: string[]) => void | Promise<void>
  showActions?: boolean
  isContinuing?: boolean
  isEncrypted?: boolean
  status?: 'sending' | 'sent' | 'delivered' | 'read'
  authorBadges?: UserBadge[]
  isBot?: boolean
  embeds?: {
    title?: string
    description?: string
    color?: string
    fields?: { name: string; value: string; inline?: boolean }[]
    footer?: string
    thumbnail?: string
    image?: string
  }[]
  authorIsOfficial?: boolean
  webhookId?: string
  botActions?: {
    type: string
    label?: string
    payload: any
  }[]
}

export const MessageItem = React.memo(function MessageItem({
  id: _id,
  authorId,
  authorName,
  authorDisplayName,
  authorIsBeaconPlus,
  authorAvatar,
  authorBanner,
  authorStatus = 'offline',
  authorCustomStatus,
  authorBio,
  authorJoinedAt,
  authorRoles,
  authorAvatarDecorationId,
  authorProfileEffectId,
  authorNameDesign,
  moderationUserId,
  content,
  timestamp,
  edited,
  reactions,
  attachments,
  components,
  canDelete,
  canEdit,
  isPinned,
  onReaction,
  onDelete,
  onEdit,
  onPin,
  onReportMessage,
  onReportUser,
  onComponentInteraction,
  showActions,
  isContinuing,
  isEncrypted,
  status = 'read',
  authorBadges,
  isBot,
  authorIsOfficial,
  webhookId,
  embeds,
  botActions,
}: MessageItemProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [reactionAnchorEl, setReactionAnchorEl] = useState<HTMLElement | null>(null)
  const inlineReactionButtonRef = useRef<HTMLButtonElement>(null)
  const actionsReactionButtonRef = useRef<HTMLButtonElement>(null)
  const [showMobileActions, setShowMobileActions] = useState(false)
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null)
  const { user } = useAuthStore()

  // Normalize reaction shapes from optimistic client, grouped gateway payloads, and raw DB rows.
  const normalizedReactions: MessageReaction[] = (() => {
    const grouped = new Map<string, MessageReaction>()

    for (const reaction of reactions || []) {
      const r: any = reaction
      const emojiName = String(r?.emoji?.name || r?.emoji || '').trim()
      if (!emojiName) continue

      if (Array.isArray(r.users)) {
        grouped.set(emojiName, {
          emoji: emojiName,
          count: r.users.length,
          userReacted: !!(user && r.users.includes(user.id)),
          isSuper: !!r.isSuper,
        })
        continue
      }

      if (typeof r.count === 'number') {
        grouped.set(emojiName, {
          emoji: emojiName,
          count: r.count,
          userReacted: !!r.userReacted,
          isSuper: !!r.isSuper,
        })
        continue
      }

      // Raw DB row shape: { emoji: string, userId: string, isSuper?: boolean }
      const existing = grouped.get(emojiName) || { emoji: emojiName, count: 0, userReacted: false, isSuper: false }
      const isCurrentUser = !!(user && r.userId && r.userId === user.id)
      grouped.set(emojiName, {
        emoji: emojiName,
        count: existing.count + 1,
        userReacted: existing.userReacted || isCurrentUser,
        isSuper: existing.isSuper || !!r.isSuper,
      })
    }

    return Array.from(grouped.values()).filter((r) => r.count > 0)
  })()
  const { arts, equippedFrame } = useProfileArtStore()
  const chatBubbleStyle = useUIStore((state) => state.chatBubbleStyle)
  const chatBubbleIntensity = useUIStore((state) => state.chatBubbleIntensity)
  const setSelectedUser = useUIStore((state) => state.setSelectedUser)
  const setShowUserProfile = useUIStore((state) => state.setShowUserProfile)
  const hasBeaconPlus = Boolean(authorIsBeaconPlus)
  const isSelf = !!user && (authorId === user.id || authorId === 'current-user')
  const displayAuthorName = isSelf ? (user?.username || authorName) : authorName
  const displayAuthorAvatar = isSelf ? (user?.avatar || authorAvatar) : authorAvatar
  const displayAuthorStatus = (isSelf ? user?.status : authorStatus) || 'offline'
  // Show frame for self using equipped frame; show correct frame for others using their decoration ID
  const frameArt = isSelf
    ? arts.find(a => a.id === equippedFrame)
    : (authorAvatarDecorationId ? arts.find(a => a.id === authorAvatarDecorationId) : null)
  const isMentioned = (!!user && content.includes(`@${user.username}`)) || content.includes('@You') || content.includes('@everyone') || content.includes('@here')
  const ownStatusClass =
    status === 'read'
      ? styles.ownStatusRead
      : status === 'sending'
        ? styles.ownStatusSending
        : styles.ownStatusMuted
  const resolveBubbleStyle = (effectId?: string | null) => {
    switch (effectId) {
      case 'effect-nebula-pulse':
        return 'aurora'
      case 'effect-cyber-static':
        return 'carbon'
      default:
        return null
    }
  }

  const authorColor = useMemo(() => {
    if (!authorRoles || authorRoles.length === 0) return 'inherit'
    return authorRoles.find(r => r.color && r.color !== '#000000')?.color || 'inherit'
  }, [authorRoles])

  const effectiveBubbleStyle = null // Disabled per user request
  const effectiveBubbleIntensity = 'medium'
  const bubbleClass = '' // Disabled per user request

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, ease: 'easeOut' }}
      className={`
        ${styles.message} 
        ${showActions ? styles.withActions : ''} 
        ${isContinuing ? styles.continuing : ''} 
        ${isMentioned ? styles.mentioned : ''}
      `}
      data-author-id={authorId}
      onMouseEnter={() => {/* Trigger chromatic aberration in CSS */ }}
    >
      {!isContinuing ? (
        <div
          onClick={() => {
            setSelectedUser(moderationUserId || authorId || '')
            setShowUserProfile(true)
          }}
          style={{ cursor: 'pointer' }}
        >
          <Avatar
            src={displayAuthorAvatar}
            alt={displayAuthorName}
            size="md"
            status={displayAuthorStatus as any}
            username={displayAuthorName}
            frameUrl={frameArt?.imageUrl}
            frameGradient={!frameArt?.imageUrl ? frameArt?.preview : undefined}
          />
        </div>
      ) : (
        <div className={styles.continueTime}>{timestamp}</div>
      )}

      <div className={`${styles.content} ${bubbleClass}`}>
        {!isContinuing && (
          <div className={styles.header}>
            <span
              className={styles.author}
              onClick={() => {
                setSelectedUser(moderationUserId || authorId || '')
                setShowUserProfile(true)
              }}
              style={{ cursor: 'pointer' }}
            >
              <CustomUsername 
                username={displayAuthorName} 
                design={authorNameDesign} 
                baseColor={authorColor} 
              />
            </span>
            {webhookId && <BotTag type="webhook" />}
            {!webhookId && isBot && <BotTag type="app" verified={authorIsOfficial} />}
            <span className={styles.time}>{timestamp}</span>
            {isPinned && (
              <span className={styles.pinnedBadge}>
                <Pin size={11} />
                Pinned
              </span>
            )}
            {isSelf && (
              <span className={`${styles.ownStatus} ${ownStatusClass}`} title={`Status: ${status}`}>
                {status === 'sending' ? (
                  <span className={styles.sendingDot}>•</span>
                ) : (
                  <Check size={14} className={styles.statusIcon} />
                )}
              </span>
            )}
            {isEncrypted && (
              <Tooltip content="End-to-end encrypted">
                <Shield size={12} style={{ color: 'var(--beacon-brand)', marginLeft: 4 }} />
              </Tooltip>
            )}
            {edited && <span className={styles.edited}>(edited)</span>}
          </div>
        )}

        <div className={styles.text}>
          <MarkdownRenderer content={content} />
          {translatedContent && (
            <div className={styles.translationOverlay}>
              <div className={styles.translationDivider} />
              <div className={styles.translationHeader}>
                <Languages size={12} />
                 <span>Translated</span>
              </div>
              <MarkdownRenderer content={translatedContent} />
            </div>
          )}
        </div>

        {/* ── Bot Embeds ── */}
        {embeds && embeds.length > 0 && (
          <div className={styles.botEmbeds}>
            {embeds.map((embed, i) => (
              <div
                key={i}
                className={`${styles.botEmbed} ${embed.thumbnail ? styles.botEmbedWithThumb : ''}`}
                style={{ borderLeftColor: embed.color || 'var(--beacon-brand)' }}
              >
                {embed.title && <div className={styles.embedTitle}>{embed.title}</div>}
                {embed.description && <div className={styles.embedDesc}>{embed.description}</div>}
                {embed.thumbnail && <img src={embed.thumbnail} alt="" className={styles.embedThumb} />}
                {embed.fields && embed.fields.length > 0 && (
                  <div className={styles.embedFields}>
                    {embed.fields.map((f, j) => (
                      <div key={j} className={`${styles.embedField} ${f.inline ? styles.embedFieldInline : ''}`}>
                        <div className={styles.embedFieldName}>{f.name}</div>
                        <div className={styles.embedFieldValue}>{f.value}</div>
                      </div>
                    ))}
                  </div>
                )}
                {embed.image && <img src={embed.image} alt="" className={styles.embedImage} />}
                {embed.footer && <div className={styles.embedFooter}>{embed.footer}</div>}
              </div>
            ))}
          </div>
        )}

        {/* ── Bot Action Buttons ── */}
        {botActions && botActions.length > 0 && (
          <div className={styles.botActionBar}>
            {botActions.map((action, i) => (
              <button
                key={i}
                className={styles.botActionBtn}
                onClick={() => {
                  console.log('[Bot Action]', action.type, action.payload)
                  // Dispatch slash command or open link  
                }}
              >
                {action.label || action.type}
              </button>
            ))}
          </div>
        )}

        {attachments && attachments.length > 0 && (
          <div className={styles.attachments}>
            {attachments?.map((attachment) => (
              <div key={attachment.id} className={styles.attachment}>
                {(() => {
                  const rawUrl = attachment.url || ''
                  const url = resolveAssetUrl(rawUrl)
                  const lowerUrl = url.toLowerCase()
                  const contentType = (attachment.contentType || '').toLowerCase()
                  
                  // Augmented detection logic
                  const isVideo = contentType.startsWith('video/') || 
                                 /\.(mp4|webm|mov|m4v|mkv)$/i.test(lowerUrl) ||
                                 /\.(mp4|webm|mov|m4v|mkv)$/i.test(attachment.filename?.toLowerCase() || '')
                  
                  const isAudio = contentType.startsWith('audio/') || 
                                 /\.(mp3|wav|ogg|m4a|aac|flac|m4b)$/i.test(lowerUrl) ||
                                 /\.(mp3|wav|ogg|m4a|aac|flac|m4b)$/i.test(attachment.filename?.toLowerCase() || '')
                                 
                  const isImage = contentType.startsWith('image/') || 
                                 /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(lowerUrl) ||
                                 /\.(png|jpg|jpeg|gif|webp|svg|bmp)$/i.test(attachment.filename?.toLowerCase() || '')

                  const formatSize = (bytes: number) => {
                    if (!bytes) return 'Unknown size'
                    const k = 1024
                    const sizes = ['B', 'KB', 'MB', 'GB']
                    const i = Math.floor(Math.log(bytes) / Math.log(k))
                    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
                  }

                  const handleDownload = async (e: React.MouseEvent) => {
                    e.preventDefault()
                    e.stopPropagation()
                    if (!url) return;

                    try {
                      // Try direct blob download for better naming/experience
                      const response = await fetch(url)
                      if (!response.ok) throw new Error('Fetch failed')
                      const blob = await response.blob()
                      const blobUrl = window.URL.createObjectURL(blob)
                      const link = document.createElement('a')
                      link.href = blobUrl
                      link.download = attachment.filename || 'download'
                      document.body.appendChild(link)
                      link.click()
                      document.body.removeChild(link)
                      window.URL.revokeObjectURL(blobUrl)
                    } catch (err) {
                      console.warn('Direct download failed, falling back to window.open:', err)
                      // Fallback: simple open in new tab (works for cross-origin if CORS fetch fails)
                      window.open(url, '_blank', 'noopener,noreferrer')
                    }
                  }

                  const downloadBtn = (
                    <button
                      className={styles.downloadBtn}
                      onClick={handleDownload}
                      title={`Download ${attachment.filename || 'file'}`}
                    >
                      <Download size={16} />
                    </button>
                  )

                  if (isImage) {
                     return (
                      <div className={styles.mediaWrapper}>
                        <img
                          src={url}
                          alt={attachment.filename}
                          className={styles.imageAttachment}
                          onClick={(e) => {
                            e.stopPropagation()
                            setLightboxSrc(url)
                          }}
                          style={{ cursor: 'pointer' }}
                        />
                        {downloadBtn}
                      </div>
                    )
                  }

                  if (isVideo) {
                    return <CustomVideoPlayer src={url} filename={attachment.filename} />
                  }

                  if (isAudio) {
                    return <CustomAudioPlayer src={url} filename={attachment.filename} />
                  }

                  return (
                    <div className={styles.fileAttachment}>
                      <div className={styles.fileIconWrapper}>
                        <File size={24} />
                      </div>
                      <div className={styles.fileInfo}>
                        <a 
                          href={url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className={styles.fileName}
                          onClick={(e) => !url && e.preventDefault()}
                        >
                          {attachment.filename || 'Unnamed File'}
                        </a>
                        <div className={styles.fileMeta}>
                          <span>{formatSize(attachment.size)}</span>
                          {attachment.contentType && <span>&bull; {attachment.contentType.split('/')[1]?.toUpperCase() || attachment.contentType}</span>}
                        </div>
                      </div>
                      <button
                        className={styles.fileDownloadBtn}
                        onClick={handleDownload}
                        title="Download"
                      >
                        <Download size={18} />
                      </button>
                    </div>
                  )
                })()}
              </div>
            ))}
          </div>
        )}

        {/* ── Bot Framework Components ── */}
        {components && components.length > 0 && (
          <div className={styles.messageComponents}>
            {components?.map((row: any, i: number) => {
              // ActionRow is type 1
              if (row.type !== 1) return null;
              return (
                <div key={i} className={styles.actionRow}>
                  {row.components?.map((comp: any, j: number) => {
                    // Button is type 2
                    if (comp.type === 2) {
                      return (
                        <button
                          key={j}
                          className={`${styles.componentButton} ${styles['buttonStyle' + (comp.style || 1)]}`}
                          disabled={comp.disabled}
                          onClick={() => {
                            if (comp.url && Number(comp.style || 1) === 5) {
                              window.open(comp.url, '_blank', 'noopener,noreferrer')
                              return
                            }

                            void onComponentInteraction?.(comp)
                          }}
                        >
                          {comp.label}
                        </button>
                      )
                    }

                    if ([3, 5, 6, 7, 8].includes(comp.type)) {
                      const isMultiSelect = Number(comp.max_values ?? comp.maxValues ?? 1) > 1
                      const options = Array.isArray(comp.options) ? comp.options : []

                      return (
                        <div key={j} className={styles.selectWrapper}>
                          <Select
                            disabled={comp.disabled || options.length === 0}
                            multiple={isMultiSelect}
                            defaultValue={isMultiSelect ? [] : ''}
                            onChange={(event) => {
                              const selectedValues = Array.from(event.currentTarget.selectedOptions).map((option) => option.value)
                              void onComponentInteraction?.(comp, selectedValues)
                            }}
                          >
                            {!isMultiSelect && (
                              <option value="" disabled>
                                {comp.placeholder || 'Select an option'}
                              </option>
                            )}
                            {options.length === 0 ? (
                              <option value="" disabled>
                                {comp.placeholder || 'Dynamic dropdowns are not available here yet'}
                              </option>
                            ) : options.map((option: any, optionIndex: number) => (
                              <option key={optionIndex} value={option.value}>
                                {option.label}
                              </option>
                            ))}
                          </Select>
                        </div>
                      )
                    }

                    return null
                  })}
                </div>
              )
            })}
          </div>
        )}

        {(normalizedReactions.length > 0 || !!onReaction) && (
          <div className={styles.reactions}>
            {normalizedReactions.map((reaction) => {
              const tooltipText = reaction.userReacted
                ? reaction.count === 1
                  ? `You reacted with ${reaction.emoji}`
                  : `You and ${reaction.count - 1} other${reaction.count - 1 !== 1 ? 's' : ''} reacted with ${reaction.emoji}`
                : `${reaction.count} ${reaction.count === 1 ? 'person' : 'people'} reacted with ${reaction.emoji}`
              
              return (
                <Tooltip key={reaction.emoji} content={tooltipText} position="top">
                  <button
                    className={`${styles.reaction} ${reaction.userReacted ? styles.userReacted : ''} ${reaction.isSuper ? styles.superReaction : ''}`}
                    onClick={() => {
                      if (reaction.isSuper) {
                        const audio = new Audio('/assets/sounds/burst.mp3')
                        audio.volume = 0.5
                        audio.play().catch(() => { })
                      }
                      onReaction?.(reaction.emoji, reaction.isSuper)
                    }}
                  >
                    <span>{reaction.emoji}</span>
                    <span className={styles.count}>{reaction.count}</span>
                  </button>
                </Tooltip>
              )
            })}
            {onReaction && (
              <div className={styles.reactionAdd}>
                <Tooltip content="Add Reaction" position="top">
                  <button
                    ref={inlineReactionButtonRef}
                    className={styles.addReactionBtn}
                    onClick={() => {
                      setReactionAnchorEl(inlineReactionButtonRef.current)
                      setShowReactionPicker(!showReactionPicker)
                    }}
                    aria-label="Add reaction"
                  >
                    <Smile size={14} />
                  </button>
                </Tooltip>
                {showReactionPicker && (
                  <EmojiPicker
                    onSelect={(emoji, isSuper) => {
                      onReaction(emoji, isSuper)
                      setShowReactionPicker(false)
                    }}
                    onClose={() => setShowReactionPicker(false)}
                    anchorElement={reactionAnchorEl}
                  />
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {showActions && (onDelete || onEdit || onPin || onReportMessage || onReportUser) && (
        <div className={`${styles.actions} ${showMobileActions ? styles.actionsMobileActive : ''}`}>
          <button 
            className={styles.mobileMoreBtn}
            onClick={() => setShowMobileActions(!showMobileActions)}
            aria-label="More actions"
          >
            <MoreVertical size={18} />
          </button>
          {/* Quick Reactions */}
          {onReaction && (
            <>
              {/* Removed hardcoded duplicate quick reactions */}
              <div className={styles.actionsDivider} />
              <Tooltip content="More reactions" position="top">
                <button
                  ref={actionsReactionButtonRef}
                  className={styles.actionBtn}
                  onClick={() => {
                    setReactionAnchorEl(actionsReactionButtonRef.current)
                    setShowReactionPicker(true)
                  }}
                  aria-label="More reactions"
                >
                  <Smile size={16} />
                </button>
              </Tooltip>
            </>
          )}

          {/* Primary Actions */}
          {canEdit && (
            <Tooltip content="Edit" position="top">
              <button className={styles.actionBtn} onClick={onEdit}>
                <Edit size={16} />
              </button>
            </Tooltip>
          )}

          {onPin && (
            <Tooltip content={isPinned ? 'Unpin' : 'Pin'} position="top">
              <button className={styles.actionBtn} onClick={onPin}>
                <Pin size={16} />
              </button>
            </Tooltip>
          )}

          {canDelete && (
            <Tooltip content="Delete" position="top">
              <button className={`${styles.actionBtn} ${styles.danger}`} onClick={onDelete}>
                <Trash2 size={16} />
              </button>
            </Tooltip>
          )}

          {onReportMessage && (
            <Tooltip content="Report message" position="top">
              <button className={styles.actionBtn} onClick={onReportMessage}>
                <Flag size={16} />
              </button>
            </Tooltip>
          )}

          {onReportUser && (
            <Tooltip content="Report user" position="top">
              <button className={styles.actionBtn} onClick={onReportUser}>
                <Shield size={16} />
              </button>
            </Tooltip>
          )}

          <Tooltip content={isTranslating ? 'Translating...' : translatedContent ? 'Hide translation' : 'Translate'} position="top">
            <button
              className={styles.actionBtn}
              onClick={async () => {
                if (translatedContent) {
                  setTranslatedContent(null)
                  return
                }
                setIsTranslating(true)
                try {
                  const userLang = (navigator.language || 'en').split('-')[0]
                  const text = content.slice(0, 1000)
                  const q = encodeURIComponent(text)

                  // Try Google unofficial translate endpoint (client=gtx, no key needed)
                  const gtxUrl = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=${encodeURIComponent(userLang)}&dt=t&dt=ld&q=${q}`
                  let translated: string | null = null
                  let detectedLang = ''

                  try {
                    const res = await fetch(gtxUrl, { signal: AbortSignal.timeout(6000) })
                    if (res.ok) {
                      const data = await res.json() as [Array<[string, string]>, unknown, string]
                      translated = (data[0] || []).map(pair => pair[0] || '').join('')
                      detectedLang = data[2] || ''
                    }
                  } catch {
                    // fallback: MyMemory — detect language heuristically
                    const src = /[\u4e00-\u9fff\u3440-\u4dbf]/.test(text) ? 'zh'
                      : /[\u3040-\u309f\u30a0-\u30ff]/.test(text) ? 'ja'
                      : /[\uac00-\ud7af]/.test(text) ? 'ko'
                      : /[\u0600-\u06ff]/.test(text) ? 'ar'
                      : /[\u0400-\u04ff]/.test(text) ? 'ru'
                      : 'en'
                    const tgt = src === userLang ? 'en' : userLang
                    const mmRes = await fetch(
                      `https://api.mymemory.translated.net/get?q=${q}&langpair=${src}|${tgt}`,
                      { signal: AbortSignal.timeout(7000) }
                    )
                    const mmJson = await mmRes.json() as { responseStatus: number; responseData: { translatedText: string } }
                    if (mmJson.responseStatus === 200 && mmJson.responseData?.translatedText) {
                      translated = mmJson.responseData.translatedText
                      detectedLang = src
                    }
                  }

                  if (!translated) {
                    setTranslatedContent('Translation unavailable.')
                    return
                  }

                  // If already in user's language, offer English instead
                  if (detectedLang && detectedLang === userLang) {
                    try {
                      const langName = new Intl.DisplayNames([userLang], { type: 'language' }).of(detectedLang)
                      setTranslatedContent(`Already in ${langName || detectedLang}.`)
                    } catch {
                      setTranslatedContent('Already in your language.')
                    }
                  } else {
                    setTranslatedContent(translated)
                  }
                } catch {
                  setTranslatedContent('Translation service offline.')
                } finally {
                  setIsTranslating(false)
                }
              }}
              title="Translate"
            >
              <Languages size={16} />
            </button>
          </Tooltip>
        </div>
      )}

      <ImageLightbox 
        isOpen={!!lightboxSrc} 
        src={lightboxSrc || ''} 
        onClose={() => setLightboxSrc(null)} 
      />
    </motion.div>
  )
}, (prevProps, nextProps) => {
  return (
    prevProps.id === nextProps.id &&
    prevProps.content === nextProps.content &&
    prevProps.edited === nextProps.edited &&
    prevProps.isPinned === nextProps.isPinned &&
    prevProps.status === nextProps.status &&
    JSON.stringify(prevProps.reactions) === JSON.stringify(nextProps.reactions)
  )
})
