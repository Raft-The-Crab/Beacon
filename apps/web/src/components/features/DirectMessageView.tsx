import { useState, useEffect, useRef } from 'react'
import { Phone, Video, UserPlus, Settings, Pin } from 'lucide-react'
import { Avatar, Button, Tooltip } from '../ui'
import { MessageInput } from '../features/MessageInput'
import { MessageItem } from '../features/MessageItem'
import { useDMStore, DMChannel, DMParticipant, DirectMessage } from '../../stores/useDMStore'
import { useAuthStore } from '../../stores/useAuthStore'
import styles from './DirectMessageView.module.css'

interface DirectMessageViewProps {
  channelId: string
}

export function DirectMessageView({ channelId }: DirectMessageViewProps) {
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { user } = useAuthStore()
  const { channels, messages, sendMessage, editMessage, deleteMessage, addReaction } = useDMStore()

  const channel = channels.find((c: DMChannel) => c.id === channelId)
  const channelMessages = messages.get(channelId) || []

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [channelMessages])

  if (!channel || !user) {
    return (
      <div className={styles.emptyState}>
        <p>Select a conversation to start messaging</p>
      </div>
    )
  }

  const otherUser = channel.participants.find((p: DMParticipant) => p.id !== user.id)

  const handleSendMessage = async (content: string) => {
    if (!content.trim()) return
    await sendMessage(channelId, content)
  }

  const handleEditMessage = async (messageId: string, newContent: string) => {
    await editMessage(channelId, messageId, newContent)
    setEditingMessageId(null)
  }

  const handleDeleteMessage = async (messageId: string) => {
    await deleteMessage(channelId, messageId)
  }

  const handleReaction = async (messageId: string, emoji: string) => {
    await addReaction(channelId, messageId, emoji)
  }

  return (
    <div className={styles.container}>
      {/* DM Header */}
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <Avatar
            src={otherUser?.avatar}
            alt={otherUser?.username || 'User'}
            size="md"
            status={otherUser?.status}
          />
          <div className={styles.userDetails}>
            <h2 className={styles.username}>{otherUser?.username}</h2>
            <span className={styles.status}>
              {otherUser?.status === 'online'
                ? 'Online'
                : otherUser?.status === 'idle'
                ? 'Idle'
                : otherUser?.status === 'dnd'
                ? 'Do Not Disturb'
                : 'Offline'}
            </span>
          </div>
        </div>

        <div className={styles.actions}>
          <Tooltip content="Start Voice Call" position="bottom">
            <Button variant="ghost" size="sm">
              <Phone size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="Start Video Call" position="bottom">
            <Button variant="ghost" size="sm">
              <Video size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="Add to Group" position="bottom">
            <Button variant="ghost" size="sm">
              <UserPlus size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="Pinned Messages" position="bottom">
            <Button variant="ghost" size="sm">
              <Pin size={20} />
            </Button>
          </Tooltip>
          <Tooltip content="User Settings" position="bottom">
            <Button variant="ghost" size="sm">
              <Settings size={20} />
            </Button>
          </Tooltip>
        </div>
      </div>

      {/* Messages Area */}
      <div className={styles.messages}>
        {channelMessages.length === 0 ? (
          <div className={styles.welcomeMessage}>
            <Avatar
              src={otherUser?.avatar}
              alt={otherUser?.username || 'User'}
              size="xl"
            />
            <h3>This is the beginning of your direct message history with @{otherUser?.username}</h3>
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          <>
            {channelMessages.map((message: DirectMessage) => (
              <MessageItem
                key={message.id}
                id={message.id}
                authorName={message.authorName}
                authorAvatar={message.authorAvatar}
                content={message.content}
                timestamp={new Date(message.timestamp).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
                edited={message.edited}
                reactions={message.reactions}
                canDelete={message.authorId === user.id}
                canEdit={message.authorId === user.id}
                onReaction={(emoji) => handleReaction(message.id, emoji)}
                onDelete={() => handleDeleteMessage(message.id)}
                onEdit={
                  message.authorId === user.id
                    ? () => setEditingMessageId(message.id)
                    : undefined
                }
                showActions
              />
            ))}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Message Input */}
      <div className={styles.inputContainer}>
        {editingMessageId ? (
          <div className={styles.editMode}>
            <p className={styles.editLabel}>Editing message</p>
            <MessageInput
              placeholder={`Edit message...`}
              onSendMessage={(content: string, _gifUrl?: string, _attachments?: any[]) => handleEditMessage(editingMessageId, content)}
            />
            <Button variant="ghost" onClick={() => setEditingMessageId(null)}>
              Cancel
            </Button>
          </div>
        ) : (
          <MessageInput
            placeholder={`Message @${otherUser?.username}`}
            onSendMessage={(content: string, _gifUrl?: string, _attachments?: any[]) => handleSendMessage(content)}
          />
        )}
      </div>
    </div>
  )
}
