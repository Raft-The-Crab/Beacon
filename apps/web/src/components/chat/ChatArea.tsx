import { useState, useRef, useEffect, useCallback } from 'react'
import { Hash, Bell, Pin, Users, Search, HelpCircle, Phone, Video, Inbox, ChevronDown } from 'lucide-react'
import { useMessageStore } from '../../stores/useMessageStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useServerStore } from '../../stores/useServerStore'
import { useUIStore } from '../../stores/useUIStore'
import { MessageInput } from '../features/MessageInput'
import { MessageItem } from '../features/MessageItem'
import { type UploadedFile } from '../../services/fileUpload'
import styles from './ChatArea.module.css'
import { Modal, Input, Button, ToastContainer, useToast } from '../ui'
import { wsClient } from '../../services/websocket'
import { apiClient } from '@beacon/api-client'
import { usePinnedMessagesStore } from '../../stores/usePinnedMessagesStore'
import { useAuthStore } from '../../stores/useAuthStore'

const EMPTY_ARRAY: any[] = []

interface ChatAreaProps {
  channelId: string
}

export function ChatArea({ channelId }: ChatAreaProps) {
  // Directly select the messages for the current channel
  const messages = useMessageStore((state) => state.messages.get(channelId) || EMPTY_ARRAY);
  
  // Select individual actions for better performance and stability
  const handleMessageCreate = useMessageStore(state => state.handleMessageCreate);
  const handleMessageDelete = useMessageStore(state => state.handleMessageDelete);
  const handleMessageUpdate = useMessageStore(state => state.handleMessageUpdate);

  const addTypingUser = useVoiceStore(state => state.addTypingUser);
  const removeTypingUser = useVoiceStore(state => state.removeTypingUser);

  const currentServer = useServerStore(state => state.currentServer);
  const currentChannel = currentServer?.channels?.find((channel: any) => channel.id === channelId)

  const toggleMemberList = useUIStore(state => state.toggleMemberList)
  const showMemberList = useUIStore(state => state.showMemberList)

  const { toasts, show } = useToast()
  const { pinMessage, unpinMessage, getPinnedMessages } = usePinnedMessagesStore()
  const { user } = useAuthStore()

  const [showPinnedModal, setShowPinnedModal] = useState(false)
  const [showEditChannelModal, setShowEditChannelModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [editChannelName, setEditChannelName] = useState(currentChannel?.name || '')
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null)
  const [editingMessageContent, setEditingMessageContent] = useState('')
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = useCallback((smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'instant' })
  }, [])

  // Auto-scroll on new messages if near bottom
  useEffect(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const isNearBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 120
    if (isNearBottom) scrollToBottom(false)
  }, [messages.length, scrollToBottom])

  // Show scroll-to-bottom button when scrolled up
  const handleMessagesScroll = useCallback(() => {
    const container = messagesContainerRef.current
    if (!container) return
    const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
    setShowScrollBtn(distanceFromBottom > 200)
  }, [])

  const handleSendMessage = (content: string, gifUrl?: string, attachments?: UploadedFile[]) => {
    if ((!content.trim() && !gifUrl && !attachments?.length) || !channelId) return

    const messageAttachments = attachments?.map(att => ({
      id: att.id,
      filename: att.filename,
      size: att.size,
      url: att.url,
      contentType: att.type,
    })) || []

    if (gifUrl) {
      messageAttachments.push({
        id: Date.now().toString(),
        filename: 'gif',
        size: 0,
        url: gifUrl,
        contentType: 'image/gif',
      })
    }

    const newMessage = {
      id: Date.now().toString(),
      channelId,
      authorId: 'current-user',
      content: content || '',
      attachments: messageAttachments,
      embeds: [],
      mentions: [],
      createdAt: new Date().toISOString(),
    }

    // optimistic UI update
    handleMessageCreate(newMessage as any)

    // Try websocket first, fallback to REST API
    try {
      if (wsClient.isConnected()) {
        wsClient.sendMessage(channelId, content)
      } else {
        apiClient.sendMessage(channelId, { content })
      }
    } catch (err) {
      console.warn('Send message failed:', err)
    }
  }

  const handleOpenPinned = () => {
    setShowPinnedModal(true)
  }

  const handleOpenMembers = () => {
    setShowMembersModal(true)
  }

  const handleEditChannel = () => {
    setEditChannelName(currentChannel?.name || '')
    setShowEditChannelModal(true)
  }

  const saveChannelEdit = () => {
    if (!currentServer || !channelId) return
    // TODO: Implement updateChannel method in useServerStore
    // useServerStore.getState().updateChannel(currentServer.id, channelId, { name: editChannelName })
    show(`Channel rename feature coming soon!`, 'info')
    setShowEditChannelModal(false)
  }

  const handleStartEditingMessage = (messageId: string, currentContent: string) => {
    setEditingMessageId(messageId)
    setEditingMessageContent(currentContent)
  }

  const handleTogglePin = (msg: any) => {
    const pinned = getPinnedMessages(channelId).some((p: any) => p.id === msg.id)
    if (pinned) {
      unpinMessage(channelId, msg.id)
      show('Message unpinned', 'info')
      try {
        if (wsClient.isConnected()) wsClient.unpinMessage(channelId, msg.id)
      } catch (err) { console.warn('unpin ws failed', err) }
    } else {
      const pinnedMsg = {
        id: msg.id,
        channelId,
        content: msg.content,
        authorName: msg.authorId === 'current-user' ? 'You' : msg.authorId,
        authorAvatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.authorId}`,
        timestamp: msg.createdAt,
        pinnedBy: 'current-user',
        pinnedAt: new Date().toISOString(),
      }
      pinMessage(channelId, pinnedMsg)
      show('Message pinned', 'success')
      try {
        if (wsClient.isConnected()) wsClient.pinMessage(channelId, msg.id)
      } catch (err) { console.warn('pin ws failed', err) }
    }
  }

  const saveEditedMessage = () => {
    if (!editingMessageId) return
    // optimistic update
    handleMessageUpdate(channelId, editingMessageId, { content: editingMessageContent, editedAt: new Date().toISOString() })
    show('Message updated', 'success')
    setEditingMessageId(null)
    setEditingMessageContent('')
    try {
      if (wsClient.isConnected()) {
        wsClient.editMessage(channelId, editingMessageId, editingMessageContent)
      } else {
        apiClient.updateMessage(channelId, editingMessageId, editingMessageContent)
      }
    } catch (err) {
      console.warn('Edit message failed:', err)
    }
  }

  const handleDeleteMessage = (messageId: string) => {
    if (!channelId) return
    // optimistic
    handleMessageDelete(channelId, messageId)
    try {
      if (wsClient.isConnected()) wsClient.deleteMessage(channelId, messageId)
      else apiClient.deleteMessage(channelId, messageId)
    } catch (err) {
      console.warn('Delete message failed:', err)
    }
  }

  const handleStartTyping = () => {
    addTypingUser('current-user')
  }

  const handleStopTyping = () => {
    removeTypingUser('current-user')
  }

  return (
    <div className={styles.chatArea}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.channelInfo}>
            <Hash size={24} className={styles.channelIcon} />
            <span className={styles.channelName}>{currentChannel?.name || 'general'}</span>
          </div>
          {currentChannel?.type === 'voice' && (
            <div className={styles.voiceActions}>
              <button className={styles.headerButton}><Phone size={20} /></button>
              <button className={styles.headerButton}><Video size={20} /></button>
            </div>
          )}
        </div>

        <div className={styles.headerRight}>
          <button className={styles.headerButton} title="Notifications" onClick={() => show('Notifications toggled', 'info')}><Bell size={20} /></button>
          <button className={styles.headerButton} title="Pinned Messages" onClick={handleOpenPinned}><Pin size={20} /></button>
          <button
            className={`${styles.headerButton} ${showMemberList ? styles.headerButtonActive : ''}`}
            title="Member List"
            onClick={toggleMemberList}
          >
            <Users size={20} />
          </button>
          <div className={styles.searchBar}>
            <input type="text" placeholder="Search" />
            <Search size={16} />
          </div>
          <button className={styles.headerButton} title="Inbox" onClick={() => show('Inbox opened', 'info')}><Inbox size={20} /></button>
          <button className={styles.headerButton} title="Help" onClick={() => show('Help opened', 'info')}><HelpCircle size={20} /></button>
        </div>
      </div>

      <div
        className={styles.messages}
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
      >
        {messages.length === 0 ? (
          <div className={styles.welcome}>
            <div className={styles.welcomeIcon}>
              <Hash size={48} />
            </div>
            <h2 className={styles.welcomeTitle}>Welcome to #{currentChannel?.name || 'general'}!</h2>
            <p className={styles.welcomeText}>This is the start of the #{currentChannel?.name || 'general'} channel.</p>
            <button className={styles.editChannelBtn} onClick={handleEditChannel}>Edit Channel</button>
          </div>
        ) : (
          messages.map((msg, index) => {
            const prevMsg = messages[index - 1]
            const isSameUser = prevMsg?.authorId === msg.authorId
            const isRecent = prevMsg && (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000)
            const isContinuing = isSameUser && isRecent

            // Date separator logic
            const msgDate = new Date(msg.createdAt)
            const prevDate = prevMsg ? new Date(prevMsg.createdAt) : null
            const showDateSep = !prevDate || msgDate.toDateString() !== prevDate.toDateString()
            const today = new Date()
            const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1)
            let dateLabel = msgDate.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })
            if (msgDate.toDateString() === today.toDateString()) dateLabel = 'Today'
            else if (msgDate.toDateString() === yesterday.toDateString()) dateLabel = 'Yesterday'

            return (
              <div key={msg.id}>
                {showDateSep && (
                  <div className={styles.dateSeparator}>
                    <div className={styles.dateLine} />
                    <span className={styles.dateLabel}>{dateLabel}</span>
                    <div className={styles.dateLine} />
                  </div>
                )}
                <MessageItem
                  id={msg.id}
                  authorName={msg.authorId === 'current-user' ? 'You' : msg.authorId}
                  authorAvatar={`https://api.dicebear.com/7.x/avataaars/svg?seed=${msg.authorId}`}
                  content={msg.content}
                  timestamp={new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  attachments={msg.attachments}
                  edited={!!msg.editedAt}
                  isPinned={getPinnedMessages(channelId).some((p: any) => p.id === msg.id)}
                  showActions={true}
                  isContinuing={isContinuing}
                  canDelete={msg.authorId === 'current-user'}
                  canEdit={msg.authorId === 'current-user'}
                  onDelete={() => handleDeleteMessage(msg.id)}
                  onEdit={() => handleStartEditingMessage(msg.id, msg.content)}
                  onPin={() => handleTogglePin(msg)}
                  onReaction={(emoji) => {
                    const target = messages.find((m: any) => m.id === msg.id)
                    if (!target) return
                    const existingReactions = target.reactions || []
                    const reactionExistsForUser = (r: any) => {
                      if (r.users && Array.isArray(r.users)) return !!(user && r.users.includes(user.id))
                      return !!r.userReacted
                    }
                    const found = existingReactions.find((r: any) => {
                      const name = r.emoji?.name || r.emoji
                      return name === emoji
                    })
                    let newReactions
                    if (found) {
                      newReactions = existingReactions.map((r: any) => {
                        const name = r.emoji?.name || r.emoji
                        if (name !== emoji) return r
                        const userReacted = !reactionExistsForUser(r)
                        const count = userReacted ? (r.count || (r.users ? r.users.length : 0)) + 1 : Math.max(0, (r.count || (r.users ? r.users.length : 1)) - 1)
                        return { ...r, emoji: emoji, userReacted, count }
                      })
                    } else {
                      newReactions = [...existingReactions, { emoji, count: 1, userReacted: true }]
                    }
                    handleMessageUpdate(channelId, msg.id, { reactions: newReactions })
                    try {
                      const existed = !!found && reactionExistsForUser(found)
                      if (wsClient.isConnected()) wsClient.reactMessage(channelId, msg.id, emoji, existed)
                      else { if (existed) apiClient.removeReaction(channelId, msg.id, emoji); else apiClient.addReaction(channelId, msg.id, emoji) }
                    } catch (err) { console.warn('Persist reaction failed', err) }
                  }}
                />
              </div>
            )
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Scroll to bottom button */}
      {showScrollBtn && (
        <button
          className={styles.scrollToBottom}
          onClick={() => scrollToBottom(true)}
          title="Scroll to bottom"
        >
          <ChevronDown size={20} />
        </button>
      )}

      <MessageInput
        placeholder={`Message #${currentChannel?.name || 'general'}...`}
        onSendMessage={handleSendMessage}
        onStartTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
      />
      <Modal
        isOpen={showEditChannelModal}
        onClose={() => setShowEditChannelModal(false)}
        title="Edit Channel"
      >
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          <Input value={editChannelName} onChange={(e) => setEditChannelName(e.currentTarget.value)} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => setShowEditChannelModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={saveChannelEdit}>Save</Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showPinnedModal}
        onClose={() => setShowPinnedModal(false)}
        title="Pinned Messages"
      >
        <div>
          {getPinnedMessages(channelId).length === 0 ? (
            <p>No pinned messages for this channel.</p>
          ) : (
            getPinnedMessages(channelId).map((p: any) => (
              <div key={p.id} style={{ padding: 8, borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div style={{ fontWeight: 600 }}>{p.authorName}</div>
                  <div>{p.content}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{new Date(p.pinnedAt).toLocaleString()}</div>
                </div>
                <div>
                  <Button variant="secondary" onClick={() => {
                    unpinMessage(channelId, p.id)
                    show('Message unpinned', 'info')
                    try { if (wsClient.isConnected()) wsClient.unpinMessage(channelId, p.id) } catch (err) { console.warn('unpin ws failed', err) }
                  }}>Unpin</Button>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={showMembersModal}
        onClose={() => setShowMembersModal(false)}
        title="Members"
      >
        <div>
          {!currentServer?.members ? (
            <p>Loading members...</p>
          ) : currentServer.members.length === 0 ? (
            <p>No members in this server.</p>
          ) : (
            currentServer.members.map((m: any) => (
              <div key={m.userId} style={{ padding: 8, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <img src={m.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${m.userId}`} alt={m.username} style={{ width: 28, height: 28, borderRadius: 6 }} />
                <div>
                  <div style={{ fontWeight: 600 }}>{m.username || m.userId}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted)' }}>{m.role || ''}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!editingMessageId}
        onClose={() => { setEditingMessageId(null); setEditingMessageContent('') }}
        title="Edit Message"
      >
        <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
          <textarea value={editingMessageContent} onChange={(e) => setEditingMessageContent(e.currentTarget.value)} style={{ minHeight: 120 }} />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            <Button variant="secondary" onClick={() => { setEditingMessageId(null); setEditingMessageContent('') }}>Cancel</Button>
            <Button variant="primary" onClick={saveEditedMessage}>Save</Button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={() => { }} />
    </div>
  )
}

