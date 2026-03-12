import React, { useRef, useState } from 'react'
import { Smile, Edit, Trash2, File, Pin, Shield, Languages } from 'lucide-react'
import type { UserBadge } from '@beacon/types'
import { Avatar, Tooltip, EmojiPicker } from '../ui'
import { UserBadges, BotTag } from '../ui/UserBadges'
import { useAuthStore } from '../../stores/useAuthStore'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import { useProfileArtStore } from '../../stores/useProfileArtStore'
import { UserPopoverCard } from './UserPopoverCard'
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
  authorAvatar?: string
  authorStatus?: 'online' | 'idle' | 'dnd' | 'offline'
  authorCustomStatus?: string
  authorBio?: string
  authorJoinedAt?: string
  authorRoles?: { name: string; color: string }[]
  authorBannerColor?: string
  authorAvatarDecorationId?: string | null
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
  authorAvatar,
  authorStatus = 'offline',
  authorCustomStatus,
  authorBio,
  authorJoinedAt,
  authorRoles,
  authorBannerColor,
  authorAvatarDecorationId,
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
  showActions,
  isContinuing,
  isEncrypted,
  status = 'read',
  authorBadges,
  isBot,
  embeds,
  botActions,
}: MessageItemProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const [reactionAnchorEl, setReactionAnchorEl] = useState<HTMLElement | null>(null)
  const inlineReactionButtonRef = useRef<HTMLButtonElement>(null)
  const actionsReactionButtonRef = useRef<HTMLButtonElement>(null)
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const { user } = useAuthStore()

  // Normalize reaction objects to { emoji, count, userReacted }
  const normalizedReactions: MessageReaction[] = (reactions || []).map((r: any) => {
    // server shape: { emoji: { name }, users: [userId] }
    if (r && r.users) {
      const emojiName = r.emoji?.name || r.emoji
      const users: string[] = r.users || []
      return {
        emoji: typeof emojiName === 'string' ? emojiName : emojiName?.name || '•',
        count: users.length,
        userReacted: !!(user && users.includes(user.id)),
        isSuper: r.isSuper || false
      }
    }

    // client optimistic shape: { emoji, count, userReacted, isSuper }
    return {
      emoji: r.emoji,
      count: r.count || 0,
      userReacted: !!r.userReacted,
      isSuper: !!r.isSuper
    }
  })
  const { arts, equippedFrame } = useProfileArtStore()
  const isSelf = !!user && (authorId === user.id || authorName === user.username || authorName === 'You')
  const displayAuthorName = isSelf ? (user?.username || authorName) : authorName
  const displayAuthorAvatar = isSelf ? (user?.avatar || authorAvatar) : authorAvatar
  const displayAuthorStatus = (isSelf ? user?.status : authorStatus) || 'offline'
  const frameArt = isSelf ? arts.find(a => a.id === equippedFrame) : null
  const isMentioned = (!!user && content.includes(`@${user.username}`)) || content.includes('@You') || content.includes('@everyone') || content.includes('@here')
  const ownStatusClass =
    status === 'read'
      ? styles.ownStatusRead
      : status === 'sending'
        ? styles.ownStatusSending
        : styles.ownStatusMuted

  return (
    <div
      className={`
        ${styles.message} 
        ${showActions ? styles.withActions : ''} 
        ${isContinuing ? styles.continuing : ''} 
        ${isMentioned ? styles.mentioned : ''}
      `}
      onMouseEnter={() => {/* Trigger chromatic aberration in CSS */ }}
    >
      {!isContinuing ? (
        <Avatar
          src={displayAuthorAvatar}
          alt={displayAuthorName}
          size="md"
          status={displayAuthorStatus as any}
          username={displayAuthorName}
          frameUrl={frameArt?.imageUrl}
          frameGradient={!frameArt?.imageUrl ? frameArt?.preview : undefined}
        />
      ) : (
        <div className={styles.continueTime}>{timestamp}</div>
      )}

      <div className={styles.content}>
        {!isContinuing && (
          <div className={styles.header}>
            <UserPopoverCard
              username={displayAuthorName}
              avatar={displayAuthorAvatar}
              status={displayAuthorStatus as any}
              customStatus={authorCustomStatus || (isSelf ? (user?.statusText || user?.customStatus || undefined) : undefined) || undefined}
              badges={authorBadges || (isSelf ? user?.badges : undefined)}
              isBot={isBot}
              bio={authorBio || (isSelf ? user?.bio || undefined : 'A Beacon user exploring the cosmos.')}
              joinedAt={authorJoinedAt}
              roles={authorRoles && authorRoles.length > 0 ? authorRoles : isSelf ? [{ name: 'You', color: '#5865f2' }] : []}
              bannerColor={authorBannerColor || '#5865f2'}
              avatarDecorationId={authorAvatarDecorationId || (isSelf ? user?.avatarDecorationId : undefined)}
            >
              <span className={styles.author}>{displayAuthorName}</span>
            </UserPopoverCard>
            {isBot && <BotTag />}
            <UserBadges badges={authorBadges} isBot={isBot} size="sm" />
            <span className={styles.time}>{timestamp}</span>
            {isPinned && (
              <span className={styles.pinnedBadge}>
                <Pin size={11} />
                Pinned
              </span>
            )}
            {isSelf && (
              <span className={`${styles.ownStatus} ${ownStatusClass}`} title={`Status: ${status}`}>
                {status === 'sending' ? '•' : status === 'sent' ? '✓' : '✓✓'}
              </span>
            )}
            {isEncrypted && (
              <Tooltip content="End-to-end encrypted">
                <Shield size={12} style={{ color: 'var(--brand-experiment)', marginLeft: 4 }} />
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
                <span>Translated by Beacon AI</span>
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
                style={{ borderLeftColor: embed.color || '#5865F2' }}
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
                {attachment.contentType?.startsWith('image/') ? (
                  <img
                    src={attachment.url}
                    alt={attachment.filename}
                    className={styles.imageAttachment}
                    onClick={() => window.open(attachment.url, '_blank')}
                  />
                ) : (
                  <div className={styles.fileAttachment}>
                    <File size={20} />
                    <a href={attachment.url} target="_blank" rel="noopener noreferrer">
                      {attachment.filename}
                    </a>
                  </div>
                )}
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
                            // In a real environment, send WSS event INTERACTION_CREATE or POST /api/interactions
                            console.log('[Gateway Event] INTERACTION_CREATE:', { customId: comp.custom_id || comp.customId, messageId: _id })
                          }}
                        >
                          {comp.label}
                        </button>
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

      {showActions && (onDelete || onEdit || onPin) && (
        <div className={styles.actions}>
          {/* Quick Reactions */}
          {onReaction && (
            <>
              <button className={styles.actionBtn} onClick={() => onReaction('👍', false)} title="Add 👍">
                👍
              </button>
              <button className={styles.actionBtn} onClick={() => onReaction('❤️', false)} title="Add ❤️">
                ❤️
              </button>
              <button className={styles.actionBtn} onClick={() => onReaction('😂', false)} title="Add 😂">
                😂
              </button>
              <button className={styles.actionBtn} onClick={() => onReaction('😮', false)} title="Add 😮">
                😮
              </button>
              <button className={styles.actionBtn} onClick={() => onReaction('😢', false)} title="Add 😢">
                😢
              </button>
              <button className={styles.actionBtn} onClick={() => onReaction('🔥', false)} title="Add 🔥">
                🔥
              </button>
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
                  await new Promise((r) => setTimeout(r, 800))
                  const isCJK = /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/.test(content)
                  const translation = isCJK
                    ? `[English]: ${content} (Simulation)`
                    : `[Target Language]: ${content} (Beacon AI Titan III)`
                  setTranslatedContent(translation)
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
    </div>
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
