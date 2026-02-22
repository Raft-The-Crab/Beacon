import { useState } from 'react'
import { Heart, Smile, MoreVertical, Copy, Edit, Trash2, File, Pin, Shield } from 'lucide-react'

import { Avatar, Tooltip, Dropdown, EmojiPicker } from '../ui'
import { useAuthStore } from '../../stores/useAuthStore'
import { useReactionsStore } from '../../stores/useReactionsStore'
import { MarkdownRenderer } from '../ui/MarkdownRenderer'
import styles from './MessageItem.module.css'

export interface MessageReaction {
  emoji: string
  count: number
  userReacted: boolean
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
  onReaction?: (emoji: string) => void
  onDelete?: () => void
  onEdit?: () => void
  onPin?: () => void
  showActions?: boolean
  isContinuing?: boolean
  isEncrypted?: boolean
}

export function MessageItem({
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
}: MessageItemProps) {
  const [showReactionPicker, setShowReactionPicker] = useState(false)
  const { customReactions } = useReactionsStore()
  const { user } = useAuthStore()

  // Normalize reaction objects to { emoji, count, userReacted }
  const normalizedReactions = (reactions || []).map((r: any) => {
    // server shape: { emoji: { name }, users: [userId] }
    if (r && r.users) {
      const emojiName = r.emoji?.name || r.emoji
      const users: string[] = r.users || []
      return {
        emoji: typeof emojiName === 'string' ? emojiName : emojiName?.name || '•',
        count: users.length,
        userReacted: !!(user && users.includes(user.id)),
      }
    }

    // client optimistic shape: { emoji, count, userReacted }
    return {
      emoji: r.emoji,
      count: r.count || 0,
      userReacted: !!r.userReacted,
    }
  })

  return (
    <div className={`${styles.message} ${showActions ? styles.withActions : ''} ${isContinuing ? styles.continuing : ''}`}>
      {!isContinuing ? (
        <Avatar src={authorAvatar} alt={authorName} size="md" />
      ) : (
        <div className={styles.continueTime}>{timestamp}</div>
      )}

      <div className={styles.content}>
        {!isContinuing && (
          <div className={styles.header}>
            <span className={styles.author}>{authorName}</span>
            <span className={styles.time}>{timestamp}</span>
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
        </div>

        {attachments && attachments.length > 0 && (
          <div className={styles.attachments}>
            {attachments.map((attachment) => (
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
            {components.map((row: any, i: number) => {
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
                onClick={() => onReaction(emoji)}
                title={`React with ${emoji}`}
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {normalizedReactions && normalizedReactions.length > 0 && (
          <div className={styles.reactions}>
            {normalizedReactions.map((reaction) => (
              <button
                key={reaction.emoji}
                className={`${styles.reaction} ${reaction.userReacted ? styles.userReacted : ''}`}
                onClick={() => onReaction?.(reaction.emoji)}
                title={`You and ${reaction.count - (reaction.userReacted ? 1 : 0)} others reacted`}
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
                      onSelect={(emoji) => {
                        onReaction(emoji)
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
          <Dropdown
            trigger={<MoreVertical size={18} />}
            items={[
              ...(canEdit
                ? [
                  {
                    id: 'edit',
                    label: 'Edit',
                    icon: <Edit size={16} />,
                    onClick: onEdit,
                  },
                ]
                : []),
              ...(onReaction
                ? [
                  {
                    id: 'react',
                    label: 'React',
                    icon: <Heart size={16} />,
                    onClick: () => setShowReactionPicker(true),
                  },
                ]
                : []),
              ...(onPin
                ? [
                  {
                    id: 'pin',
                    label: isPinned ? 'Unpin' : 'Pin',
                    icon: <Pin size={16} />,
                    onClick: onPin,
                  },
                ]
                : []),
              {
                id: 'copy',
                label: 'Copy',
                icon: <Copy size={16} />,
                onClick: () => navigator.clipboard.writeText(content),
              },
              ...(canDelete
                ? [
                  {
                    id: 'delete',
                    label: 'Delete',
                    icon: <Trash2 size={16} />,
                    onClick: onDelete,
                    variant: 'danger' as const,
                  },
                ]
                : []),
            ]}
            align="right"
          />
        </div>
      )}
    </div>
  )
}
