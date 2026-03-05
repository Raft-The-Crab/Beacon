import React, { useState } from 'react'
import { Smile, MoreVertical, Copy, Edit, Trash2, File, Pin, Shield, Languages } from 'lucide-react'
import type { UserBadge } from '@beacon/types'
import { Avatar, Tooltip, Dropdown, EmojiPicker } from '../ui'
import { UserBadges, BotTag } from '../ui/UserBadges'
import { useAuthStore } from '../../stores/useAuthStore'
import { useReactionsStore } from '../../stores/useReactionsStore'
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
  authorName: string
  authorAvatar?: string
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
  authorName,
  authorAvatar,
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
  const [translatedContent, setTranslatedContent] = useState<string | null>(null)
  const [isTranslating, setIsTranslating] = useState(false)
  const { customReactions } = useReactionsStore()
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
  const isSelf = authorName === 'You'
  const frameArt = isSelf ? arts.find(a => a.id === equippedFrame) : null
  const isMentioned = content.includes('@You') || content.includes('@everyone') || content.includes('@here')

  return (
    <div
      className={`
        ${styles.message} 
        ${showActions ? styles.withActions : ''} 
        ${isContinuing ? styles.continuing : ''} 
        ${isMentioned ? styles.mentioned : ''}
      `}
      style={isMentioned ? {
        boxShadow: '0 0 30px rgba(250, 168, 26, 0.15)',
        background: 'rgba(250, 168, 26, 0.05)'
      } : {}}
      onMouseEnter={() => {/* Trigger chromatic aberration in CSS */ }}
    >
      {!isContinuing ? (
        <Avatar
          src={authorAvatar}
          alt={authorName}
          size="md"
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
              username={authorName}
              avatar={authorAvatar}
              badges={authorBadges}
              isBot={isBot}
              bio="A Beacon user exploring the cosmos."
              roles={[{ name: 'Member', color: '#5865f2' }]}
            >
              <span className={styles.author}>{authorName}</span>
            </UserPopoverCard>
            {isBot && <BotTag />}
            <UserBadges badges={authorBadges} isBot={isBot} size="sm" />
            <span className={styles.time}>{timestamp}</span>
            {authorName === 'You' && (
              <span style={{ fontSize: 10, marginLeft: 6, color: status === 'read' ? 'var(--brand-experiment)' : 'var(--text-muted)' }} title={`Status: ${status}`}>
                {status === 'sending' ? '•' : status === 'sent' ? '✓' : '✓✓'}
              </span>
            )}
            {isEncrypted && (
              <Tooltip content="End-to-end encrypted">
                <Shield size={12} style={{ color: 'var(--brand-experiment)', marginLeft: 4 }} />
              </Tooltip>
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
              <div key={i} className={styles.botEmbed} style={{ borderLeftColor: embed.color || '#5865F2' }}>
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
                  // TODO: dispatch slash command or open link  
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

        {/* Quick reactions bar (from user settings) */}
        {onReaction && customReactions && customReactions.length > 0 && (
          <div className={styles.quickReactions}>
            {customReactions.map((emoji) => (
              <button
                key={emoji}
                className={styles.quickReactionBtn}
                onClick={() => onReaction(emoji, false)}
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {normalizedReactions && normalizedReactions.length > 0 && (
          <div className={styles.reactions}>
            {normalizedReactions?.map((reaction) => (
              <button
                key={reaction.emoji}
                className={`${styles.reaction} ${reaction.userReacted ? styles.userReacted : ''} ${reaction.isSuper ? styles.superReaction : ''}`}
                onClick={() => {
                  if (reaction.isSuper) {
                    // Play a random burst sound for super reactions
                    const audio = new Audio('/assets/sounds/burst.mp3')
                    audio.volume = 0.5
                    audio.play().catch(() => { })
                  }
                  onReaction?.(reaction.emoji, reaction.isSuper)
                }}
                title={`You and ${reaction.count - (reaction.userReacted ? 1 : 0)} others reacted ${reaction.isSuper ? '(Super Reaction)' : ''}`}
              >
                <span>{reaction.emoji}</span>
                <span className={styles.count}>{reaction.count}</span>
              </button>
            ))}
            {onReaction && (
              <div className={styles.reactionAdd}>
                <Tooltip content="Add reaction" position="top">
                  <button
                    className={styles.addReactionBtn}
                    onClick={() => setShowReactionPicker(!showReactionPicker)}
                  >
                    <Smile size={16} />
                  </button>
                </Tooltip>
                {showReactionPicker && (
                  <div className={styles.fullEmojiPicker}>
                    <EmojiPicker
                      onSelect={(emoji, isSuper) => {
                        onReaction(emoji, isSuper)
                        setShowReactionPicker(false)
                      }}
                      onClose={() => setShowReactionPicker(false)}
                    />
                  </div>
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
              <Tooltip content="Thumbs Up" position="top">
                <button className={styles.actionBtn} onClick={() => onReaction('👍', false)}>👍</button>
              </Tooltip>
              <Tooltip content="Heart" position="top">
                <button className={styles.actionBtn} onClick={() => onReaction('❤️', false)}>❤️</button>
              </Tooltip>
              <Tooltip content="Laugh" position="top">
                <button className={styles.actionBtn} onClick={() => onReaction('😂', false)}>😂</button>
              </Tooltip>
              <div style={{ width: 1, height: 20, background: 'var(--glass-border)', margin: '0 4px' }} />
              <Tooltip content="Add Reaction" position="top">
                <button className={styles.actionBtn} onClick={() => setShowReactionPicker(true)}>
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

          {/* Overflow Menu */}
          <Dropdown
            trigger={
              <button className={styles.actionBtn} title="More">
                <MoreVertical size={16} />
              </button>
            }
            items={[
              {
                id: 'copy',
                label: 'Copy Text',
                icon: <Copy size={16} />,
                onClick: () => navigator.clipboard.writeText(content),
              },
              {
                id: 'translate',
                label: isTranslating ? 'Translating...' : 'Translate',
                icon: <Languages size={16} />,
                onClick: async () => {
                  if (translatedContent) {
                    setTranslatedContent(null)
                    return
                  }
                  setIsTranslating(true)
                  try {
                    await new Promise(r => setTimeout(r, 800))
                    const isCJK = /[\u4e00-\u9fa5\u3040-\u309f\u30a0-\u30ff]/.test(content)
                    const translation = isCJK
                      ? `[English]: ${content} (Simulation)`
                      : `[Target Language]: ${content} (Beacon AI Titan III)`
                    setTranslatedContent(translation)
                  } finally {
                    setIsTranslating(false)
                  }
                },
              }
            ]}
            align="right"
          />
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
