import { useState, useRef, useEffect, useCallback } from 'react'
import { Virtuoso } from 'react-virtuoso'
import { Hash, Pin, Users, Search, Phone, Video, ChevronDown } from 'lucide-react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { InteractionType } from 'beacon-sdk'
import type { Channel, MessageWithExtras as Message } from 'beacon-sdk'
import { useMessageStore } from '../../stores/useMessageStore'
import { useVoiceStore } from '../../stores/useVoiceStore'
import { useServerStore } from '../../stores/useServerStore'
import { useDMStore } from '../../stores/useDMStore'
import { useUIStore } from '../../stores/useUIStore'
import { MessageInput } from '../features/MessageInput'
import { MessageItem } from '../features/MessageItem'
import { TypingIndicator } from '../typing/TypingIndicator'
import { type UploadedFile } from '../../services/fileUpload'
import styles from '../../styles/modules/chat/ChatArea.module.css'
import { Modal, Button, ToastContainer, useToast, Avatar, Tooltip, Select, SkeletonMessage } from '../ui'
import { wsClient } from '../../services/websocket'
import { apiClient } from '../../services/apiClient'
import { usePinnedMessagesStore } from '../../stores/usePinnedMessagesStore'
import { useAuthStore } from '../../stores/useAuthStore'
import { MessageSearch } from '../search/MessageSearch'
import { useTranslationStore } from '../../stores/useTranslationStore'

const EMPTY_ARRAY: any[] = []

interface ChatAreaProps {
  channelId: string
}

export function ChatArea({ channelId }: ChatAreaProps) {
  const navigate = useNavigate()
  const { t } = useTranslationStore()
  // Directly select the messages for the current channel
  const messages = useMessageStore((state) => state.messages.get(channelId) || EMPTY_ARRAY);
  const fetchMessages = useMessageStore((state) => state.fetchMessages);

  // Select individual actions for better performance and stability
  const handleMessageCreate = useMessageStore(state => state.handleMessageCreate);
  const handleMessageDelete = useMessageStore(state => state.handleMessageDelete);
  const handleMessageUpdate = useMessageStore(state => state.handleMessageUpdate);

  const addTypingUser = useVoiceStore(state => state.addTypingUser);
  const removeTypingUser = useVoiceStore(state => state.removeTypingUser);
  const { user } = useAuthStore()

  const currentServer = useServerStore(state => state.currentServer);
  const currentChannel = currentServer?.channels?.find((channel: any) => channel.id === channelId)
  const dmChannel = useDMStore((state) => state.channels.find((channel: any) => channel.id === channelId))
  const isDMChannel = !!dmChannel && !currentChannel
  const dmRecipient = dmChannel?.participants?.find((participant: any) => participant.id !== user?.id)?.username || dmChannel?.participants?.[0]?.username || 'Direct Message'
  const dmParticipantCount = dmChannel?.participants?.length || 1
  const dmCallName = isDMChannel
    ? (dmParticipantCount > 2 ? `Group Call (${dmParticipantCount} members)` : `Call with ${dmRecipient}`)
    : ''
  const channelDisplayName = isDMChannel ? dmRecipient : (currentChannel?.name || 'general')

  const toggleMemberList = useUIStore(state => state.toggleMemberList)
  const showMemberList = useUIStore(state => state.showMemberList)

  const { toasts, show } = useToast()
  const { pinMessage, unpinMessage, getPinnedMessages } = usePinnedMessagesStore()

  const resolveAuthor = useCallback((message: any) => {
    const author = message?.author || {}
    const targetAuthorId = author.id || message.authorId
    const isSelf = !!user && (
      message.authorId === user.id ||
      author.id === user.id ||
      (message.localOnly && message.authorId === 'current-user')
    )
    const memberRecord = (currentServer?.members as any[] | undefined)?.find((member: any) => {
      const memberId = member?.userId || member?.user?.id || member?.id
      return memberId === targetAuthorId
    })
    const roles = Array.isArray(memberRecord?.roles)
      ? memberRecord.roles.map((role: any) => ({
          name: typeof role === 'string' ? role : role?.name || 'Role',
          color: typeof role === 'string' ? '#5865f2' : role?.color || '#5865f2',
        }))
      : []

    return {
      id: isSelf ? user?.id : targetAuthorId,
      name: isSelf ? (user?.username || 'You') : (author.username || message.authorName || message.authorId || 'Unknown User'),
      displayName: isSelf ? (user as any)?.displayName : author.displayName,
      avatar: isSelf ? (user?.avatar || author.avatar) : (author.avatar || message.authorAvatar),
      banner: isSelf ? (user as any)?.banner : (author.banner || message.authorBanner),
      status: (isSelf ? user?.status : author.status || memberRecord?.status) || 'offline',
      customStatus: isSelf ? user?.statusText : memberRecord?.customStatus,
      bio: isSelf ? user?.bio : author.bio,
      joinedAt: author.createdAt || memberRecord?.joinedAt,
      roles,
      avatarDecorationId: isSelf ? user?.avatarDecorationId : author.avatarDecorationId,
      profileEffectId: isSelf ? (user as any)?.profileEffectId : author.profileEffectId,
      badges: isSelf ? user?.badges : author.badges,
      isBeaconPlus: Boolean(
        isSelf
          ? user?.isBeaconPlus
          : author.isBeaconPlus || (Array.isArray(author.badges) && author.badges.some((badge: string) => String(badge).toLowerCase() === 'beacon_plus'))
      ),
    }
  }, [currentServer?.members, user])

  const [showPinnedModal, setShowPinnedModal] = useState(false)
  const [showMembersModal, setShowMembersModal] = useState(false)
  const [membersForModal, setMembersForModal] = useState<any[]>([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [showSearch, setShowSearch] = useState(false)
  const [showReportModal, setShowReportModal] = useState(false)
  const [reportReason, setReportReason] = useState('Spam or scam')
  const [reportNotes, setReportNotes] = useState('')
  const [reportTarget, setReportTarget] = useState<{ type: 'message' | 'user'; messageId?: string; userId?: string; content?: string } | null>(null)
  const editingMessageId = useUIStore(state => state.editingMessageId)
  const editingMessageContent = useUIStore(state => state.editingMessageContent)
  const setEditingMessage = useUIStore(state => state.setEditingMessage)
  const [showScrollBtn, setShowScrollBtn] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const messagesContainerRef = useRef<HTMLDivElement>(null)
  const channelType = String(currentChannel?.type ?? '').toLowerCase()
  const isVoiceLikeChannel = channelType === 'voice' || channelType === '2' || channelType === 'stage' || channelType === '13'
  const canStartCall = isVoiceLikeChannel || isDMChannel

  const openCall = useCallback(() => {
    if (isDMChannel) {
      const callName = encodeURIComponent(dmCallName || 'Direct Message Call')
      navigate(`/voice?guildId=dm&channelId=${encodeURIComponent(channelId)}&name=${callName}&server=Direct%20Messages`)
      return
    }

    navigate(`/voice?guildId=${currentServer?.id}&channelId=${currentChannel?.id}&name=${encodeURIComponent(currentChannel?.name || 'Voice Channel')}`)
  }, [channelId, currentChannel?.id, currentChannel?.name, currentServer?.id, dmCallName, isDMChannel, navigate])

  const getMemberStatusLabel = (status?: string) => {
    if (status === 'online') return 'Online'
    if (status === 'idle') return 'Idle'
    if (status === 'dnd') return 'Do Not Disturb'
    if (status === 'invisible') return 'Invisible'
    return 'Offline'
  }

  const loadMembersForModal = useCallback(async () => {
    const guildId = currentServer?.id
    if (!guildId) {
      setMembersForModal(Array.isArray(currentServer?.members) ? currentServer.members : [])
      return
    }

    setMembersLoading(true)
    try {
      const res = await apiClient.getGuildMembers(guildId)
      if (res.success && Array.isArray(res.data)) {
        setMembersForModal(res.data)
      } else {
        setMembersForModal(Array.isArray(currentServer?.members) ? currentServer.members : [])
      }
    } catch {
      setMembersForModal(Array.isArray(currentServer?.members) ? currentServer.members : [])
    } finally {
      setMembersLoading(false)
    }
  }, [currentServer?.id, currentServer?.members])

  useEffect(() => {
    if (!showMembersModal) return
    void loadMembersForModal()
  }, [showMembersModal, loadMembersForModal])

  useEffect(() => {
    const handleStatusUpdated = (event: Event) => {
      const customEvent = event as CustomEvent<{ userId?: string; status?: string }>
      const userId = customEvent.detail?.userId
      const status = customEvent.detail?.status
      if (!userId || !status) return

      setMembersForModal((prev) => prev.map((member: any) => {
        const memberUserId = member.userId || member.user?.id || member.id
        return memberUserId === userId
          ? { ...member, status }
          : member
      }))
    }

    window.addEventListener('beacon:user-status-updated', handleStatusUpdated as EventListener)
    return () => {
      window.removeEventListener('beacon:user-status-updated', handleStatusUpdated as EventListener)
    }
  }, [])

  const appendInteractionMessage = useCallback((payload: any) => {
    if (!payload || payload.flags === 64) return false

    const hasRenderableBody = Boolean(
      payload.content?.trim() ||
      payload.embeds?.length ||
      payload.components?.length
    )

    if (!hasRenderableBody) return false

    handleMessageCreate({
      id: `interaction-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      channelId,
      authorId: 'beacon-bot',
      author: {
        id: 'beacon-bot',
        username: 'Beacon Bot',
        avatar: null,
        bot: true,
      },
      content: payload.content || '',
      attachments: [],
      embeds: payload.embeds || [],
      components: payload.components || [],
      mentions: [],
      createdAt: new Date().toISOString(),
      localOnly: true,
    } as any)

    return true
  }, [channelId, handleMessageCreate])

  const handleInteractionResult = useCallback((payload: any, successLabel: string, context?: { applicationId: string, id?: string, token?: string }) => {
    // 1. Handle Modal (type 9)
    if (payload?.type === 9 && payload.data) {
      useUIStore.getState().setShowBotModal(true, {
        id: context?.id || `modal-${Date.now()}`,
        token: context?.token || 'legacy',
        applicationId: context?.applicationId || 'unknown',
        title: payload.data.title || 'Bot Modal',
        customId: payload.data.custom_id,
        components: payload.data.components || [],
      })
      return
    }

    // 2. Handle Deferred (type 5/6)
    if (payload?.type === 5 || payload?.type === 6) {
      // In a real app we might show a "Thinking..." indicator
      // For now, we'll just show a toast if it's taking a while
      console.log('[Interaction] Bot is thinking...')
      return
    }

    const rendered = appendInteractionMessage(payload.data || payload)

    if (payload?.flags === 64 || payload?.data?.flags === 64) {
      show(payload.content || payload.data?.content || `${successLabel} completed`, 'info')
      return
    }

    if (!rendered) {
      show(payload?.content || payload?.data?.content || `${successLabel} completed`, 'success')
    }
  }, [appendInteractionMessage, show])

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

  useEffect(() => {
    if (!channelId) return
    if (messages.length > 0) return
    void fetchMessages(channelId)
  }, [channelId, messages.length, fetchMessages])

  const handleSendMessage = async (content: string, gifUrl?: string, attachments?: UploadedFile[]) => {
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

    // Send via REST API so persistence + gateway fanout stay consistent.
    try {
      const result = await apiClient.sendMessage(channelId, { content, attachments: messageAttachments })
      if (result.success && result.data) {
        handleMessageCreate({ ...result.data, channelId } as any)
      } else {
        show(result.error || 'Failed to send message', 'error')
      }
    } catch (err) {
      console.warn('Send message failed:', err)
      show('Network error. Check your connection.', 'error')
    }
  }

  const handleOpenPinned = () => {
    setShowPinnedModal(true)
  }

  // const handleOpenMembers = () => {
  //   setShowMembersModal(true)
  // }


  const handleStartEditingMessage = (messageId: string, currentContent: string) => {
    setEditingMessage(messageId, currentContent)
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
      const author = resolveAuthor(msg)
      const pinnedMsg = {
        id: msg.id,
        channelId,
        content: msg.content,
        authorName: author.name,
        authorAvatar: author.avatar || null,
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
    setEditingMessage(null)
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

  const openReportModal = (target: { type: 'message' | 'user'; messageId?: string; userId?: string; content?: string }) => {
    setReportTarget(target)
    setReportReason('Spam or scam')
    setReportNotes('')
    setShowReportModal(true)
  }

  const submitReport = async () => {
    if (!reportTarget) return

    const reason = reportNotes.trim() ? `${reportReason} — ${reportNotes.trim()}` : reportReason

    try {
      let res
      if (reportTarget.type === 'message' && reportTarget.messageId) {
        res = await apiClient.submitMessageReport({
          messageId: reportTarget.messageId,
          channelId,
          targetUserId: reportTarget.userId,
          reason,
          content: reportTarget.content,
        })
      } else if (reportTarget.type === 'user' && reportTarget.userId) {
        res = await apiClient.submitUserReport({
          targetUserId: reportTarget.userId,
          channelId,
          reason,
          content: reportTarget.content,
        })
      }

      if (res?.success) {
        show('Report submitted. Our moderation team will review it.', 'success')
        setShowReportModal(false)
        setReportTarget(null)
      } else {
        show(res?.error || 'Failed to submit report', 'error')
      }
    } catch {
      show('Failed to submit report', 'error')
    }
  }

  const handleStartTyping = () => {
    addTypingUser('current-user')
  }

  const handleStopTyping = () => {
    removeTypingUser('current-user')
  }

  const handleComponentInteraction = useCallback(async (message: any, component: any, values?: string[]) => {
    const customId = component?.custom_id || component?.customId
    if (!customId) return

    try {
      const res = await apiClient.executeInteraction({
        type: InteractionType.MESSAGE_COMPONENT,
        channelId,
        guildId: currentServer?.id ?? undefined,
        applicationId: (message as any).applicationId || (message as any).author?.applicationId,
        message: {
          id: message.id,
          content: message.content,
        },
        data: {
          customId,
          componentType: component.type,
          values: values || [],
        },
      })

      if (!res.success) {
        show(res.error || 'Interaction failed', 'error')
        return
      }

      handleInteractionResult(res.data, 'Interaction', {
        applicationId: (message as any).applicationId || (message as any).author?.applicationId || 'unknown',
        id: res.data?.id,
        token: res.data?.token
      })
    } catch (err) {
      console.warn('Component interaction failed:', err)
      show('Interaction failed', 'error')
    }
  }, [channelId, currentServer?.id, handleInteractionResult, show])

  useEffect(() => {
    const handleTypingStart = (event: any) => {
      const { channelId: evtChannelId, userId } = event.data || {}
      if (evtChannelId === channelId && userId && userId !== user?.id) {
        addTypingUser(userId)
        // Auto-clear fallback
        setTimeout(() => removeTypingUser(userId), 8000)
      }
    }

    const handleTypingStop = (event: any) => {
      const { channelId: evtChannelId, userId } = event.data || {}
      if (evtChannelId === channelId && userId) {
        removeTypingUser(userId)
      }
    }

    wsClient.on('TYPING_START', handleTypingStart)
    wsClient.on('TYPING_STOP', handleTypingStop)

    return () => {
      wsClient.off('TYPING_START', handleTypingStart)
      wsClient.off('TYPING_STOP', handleTypingStop)
    }
  }, [channelId, user?.id, addTypingUser, removeTypingUser])

  return (
    <motion.div
      className={styles.chatArea}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <div className={styles.channelInfo}>
            {isDMChannel ? (
              <Users size={22} className={styles.channelIcon} />
            ) : (
              <Hash size={24} className={styles.channelIcon} />
            )}
            <span className={styles.channelName}>{channelDisplayName}</span>
          </div>
        </div>

        <div className={styles.headerRight}>
          {canStartCall && (
            <div className={styles.voiceActions}>
              <Tooltip content="Start voice call" position="bottom">
                <button 
                  className={styles.headerButton} 
                  onClick={openCall}
                  aria-label="Start voice call"
                >
                  <Phone size={20} />
                </button>
              </Tooltip>
              <Tooltip content="Start video call" position="bottom">
                <button 
                  className={styles.headerButton} 
                  onClick={openCall}
                  aria-label="Start video call"
                >
                  <Video size={20} />
                </button>
              </Tooltip>
              <div className={styles.headerDivider} />
            </div>
          )}
          <button 
            className={`${styles.headerButton} ${styles.hideOnMobile}`} 
            title="Pinned Messages" 
            onClick={handleOpenPinned}
            aria-label="View pinned messages"
          >
            <Pin size={20} />
          </button>
          <button
            className={`${styles.headerButton} ${showMemberList ? styles.headerButtonActive : ''}`}
            title="Member List · Ctrl+Shift+M"
            onClick={toggleMemberList}
            aria-label="Toggle member list"
            aria-pressed={showMemberList}
          >
            <Users size={20} />
          </button>
          <div className={styles.searchBar} onClick={() => setShowSearch(true)} title="Search · Ctrl+F">
            <input type="text" placeholder={t('common.search', { defaultValue: 'Search' })} readOnly />
            <Search size={16} />
          </div>
          <button
            className={styles.headerButton}
            title="Keyboard Shortcuts · Ctrl+/"
            onClick={() => useUIStore.getState().setShowKeyboardShortcuts(true)}
            aria-label="Show keyboard shortcuts"
          >
            <kbd className={styles.kbdIcon}>⌘</kbd>
          </button>
        </div>
      </div>


      <div
        className={styles.messages}
        ref={messagesContainerRef}
        onScroll={handleMessagesScroll}
      >
        {useMessageStore((state) => state.isLoading.get(channelId)) ? (
          <div className={styles.skeletonContainer}>
            <SkeletonMessage />
            <SkeletonMessage />
            <SkeletonMessage />
            <SkeletonMessage />
            <SkeletonMessage />
          </div>
        ) : messages.length === 0 ? (
          <motion.div
            className={styles.welcome}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className={`${styles.welcomeIcon} glass-panel`}>
              {isDMChannel ? <Users size={44} /> : <Hash size={48} />}
            </div>
            {isDMChannel ? (
              <>
                <h2 className={`${styles.welcomeTitle} premium-text-glow`}>Start your conversation</h2>
                <p className={styles.welcomeText}>You are now chatting with {dmRecipient}.</p>
              </>
            ) : (
              <>
                <h2 className={`${styles.welcomeTitle} premium-text-glow`}>Welcome to #{channelDisplayName}!</h2>
                <p className={styles.welcomeText}>This is the start of the #{channelDisplayName} channel.</p>
              </>
            )}
          </motion.div>
        ) : (
          <Virtuoso
            data={messages}
            initialTopMostItemIndex={messages.length - 1}
            alignToBottom={true}
            followOutput={(isAtBottom) => (isAtBottom ? 'smooth' : false)}
            itemContent={(index, msg) => {
              const prevMsg = messages[index - 1]
              const isSameUser = prevMsg?.authorId === msg.authorId
              const isRecent = prevMsg && (new Date(msg.createdAt).getTime() - new Date(prevMsg.createdAt).getTime() < 5 * 60 * 1000)
              const isContinuing = isSameUser && isRecent

              // Date separator logic
              const _rawMd = msg.createdAt ? new Date(msg.createdAt) : null
              const msgDate = _rawMd && !isNaN(_rawMd.getTime()) ? _rawMd : new Date()
              const _rawPd = prevMsg?.createdAt ? new Date(prevMsg.createdAt) : null
              const prevDate = _rawPd && !isNaN(_rawPd.getTime()) ? _rawPd : null
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
                  {(() => {
                    const author = resolveAuthor(msg)
                    return (
                      <MessageItem
                        id={msg.id}
                        authorId={author.id}
                        authorName={author.displayName || author.name}
                        authorDisplayName={author.displayName}
                        authorIsBeaconPlus={author.isBeaconPlus}
                        authorAvatar={author.avatar || undefined}
                        authorBanner={author.banner || undefined}
                        authorStatus={author.status as any}
                        authorCustomStatus={author.customStatus}
                        authorBio={author.bio}
                        authorJoinedAt={author.joinedAt}
                        authorRoles={author.roles}
                        authorAvatarDecorationId={author.avatarDecorationId}
                        authorProfileEffectId={author.profileEffectId}
                        authorBadges={author.badges}
                        moderationUserId={author.id || undefined}
                        content={msg.content}
                        timestamp={(() => { const _td = msg.createdAt ? new Date(msg.createdAt) : null; return _td && !isNaN(_td.getTime()) ? _td.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '' })()}
                        attachments={msg.attachments}
                        components={msg.components}
                        embeds={msg.embeds}
                        edited={!!msg.editedAt}
                        isPinned={getPinnedMessages(channelId).some((p: any) => p.id === msg.id)}
                        isEncrypted={!!msg.nonce || !!msg.encryptedContent} // Logic for E2EE
                        showActions={!msg.localOnly}
                        isContinuing={isContinuing}
                        canDelete={
                          msg.authorId === 'current-user' ||
                          (!!user && (msg.authorId === user.id || msg.author?.id === user.id)) ||
                          (!!user && !!currentServer && currentServer.ownerId === user.id)
                        }
                        canEdit={msg.authorId === 'current-user' || (!!user && (msg.authorId === user.id || msg.author?.id === user.id))}
                        onDelete={() => handleDeleteMessage(msg.id)}
                        onEdit={() => handleStartEditingMessage(msg.id, msg.content)}
                        onPin={() => handleTogglePin(msg)}
                        onReportMessage={() => openReportModal({
                          type: 'message',
                          messageId: msg.id,
                          userId: author.id,
                          content: msg.content,
                        })}
                        onReportUser={() => openReportModal({
                          type: 'user',
                          userId: author.id,
                          content: msg.content,
                        })}
                        onComponentInteraction={(component, values) => handleComponentInteraction(msg, component, values)}
                        onReaction={msg.localOnly ? undefined : async (emoji) => {
                      const target = messages.find((m: any) => m.id === msg.id)
                      if (!target) return
                      const previousReactions = target.reactions || []
                      const existingReactions = previousReactions
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
                          const currentCount = r.count || (r.users ? r.users.length : 0)
                          const count = userReacted ? currentCount + 1 : Math.max(0, currentCount - 1)
                          return { ...r, emoji: emoji, userReacted, count }
                        }).filter((r: any) => (r.count || (r.users ? r.users.length : 0)) > 0)
                      } else {
                        newReactions = [...existingReactions, { emoji, count: 1, userReacted: true }]
                      }
                      handleMessageUpdate(channelId, msg.id, { reactions: newReactions })
                      try {
                        const existed = !!found && reactionExistsForUser(found)
                        if (existed) {
                          await apiClient.removeReaction(channelId, msg.id, emoji)
                        } else {
                          await apiClient.addReaction(channelId, msg.id, emoji)
                        }

                      } catch (err) {
                        handleMessageUpdate(channelId, msg.id, { reactions: previousReactions })
                        console.warn('Persist reaction failed', err)
                      }
                    }}
                      />
                    )
                  })()}
                </div>
              )
            }}
          />
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

      <div style={{ paddingLeft: 16 }}>
        <TypingIndicator channelId={channelId} />
      </div>

      <MessageInput
        placeholder={isDMChannel ? `Message ${dmRecipient}...` : `Message #${channelDisplayName}...`}
        onSendMessage={handleSendMessage}
        onStartTyping={handleStartTyping}
        onStopTyping={handleStopTyping}
      />

      <Modal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        title={reportTarget?.type === 'user' ? 'Report user' : 'Report message'}
      >
        <div className={styles.reportForm}>
          <label className={styles.reportLabel}>
            <span className={styles.reportLabelText}>Reason</span>
            <Select className={styles.reportSelect} value={reportReason} onChange={(e) => setReportReason(e.target.value)}>
              <option>Spam or scam</option>
              <option>Harassment or bullying</option>
              <option>Hate or abuse</option>
              <option>Violence or illegal content</option>
              <option>NSFW in safe channel</option>
              <option>Impersonation</option>
              <option>Other</option>
            </Select>
          </label>
          <label className={styles.reportLabel}>
            <span className={styles.reportLabelText}>Details (optional)</span>
            <textarea
              className={styles.reportTextarea}
              value={reportNotes}
              onChange={(e) => setReportNotes(e.target.value)}
              rows={4}
              maxLength={400}
              placeholder="Add context for moderators"
            />
          </label>
          <div className={styles.reportActions}>
            <Button variant="secondary" onClick={() => setShowReportModal(false)}>Cancel</Button>
            <Button variant="primary" onClick={submitReport}>Submit report</Button>
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
            <div className={styles.pinnedEmpty}>
              <Pin size={32} className={styles.pinnedEmptyIcon} />
              <p>No pinned messages in this channel yet.</p>
            </div>
          ) : (
            getPinnedMessages(channelId).map((p: any) => (
              <div key={p.id} className={styles.pinnedItem}>
                <div className={styles.pinnedItemContent}>
                  <div className={styles.pinnedItemAuthor}>{p.authorName}</div>
                  <div className={styles.pinnedItemText}>{p.content}</div>
                  <div className={styles.pinnedItemDate}>{new Date(p.pinnedAt).toLocaleString()}</div>
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
        <div className={styles.membersModalList}>
          {membersLoading ? (
            <p>Loading members...</p>
          ) : membersForModal.length === 0 ? (
            <p>No members in this server.</p>
          ) : (
            membersForModal.map((m: any) => (
              <div key={m.userId || m.id} className={styles.memberModalRow}>
                <Avatar username={m.username || m.userId} src={m.avatar} size="sm" />
                <div className={styles.memberModalMeta}>
                  <div className={styles.memberModalName}>{m.username || m.user?.username || m.userId || m.id}</div>
                  <div className={styles.memberModalSub}>
                    {m.role ? `${m.role} • ` : ''}
                    {getMemberStatusLabel(m.status)}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Modal>

      <Modal
        isOpen={!!editingMessageId}
        onClose={() => setEditingMessage(null)}
        title="Edit Message"
      >
        <div className={styles.editModalBody}>
          <textarea className={styles.editTextarea} value={editingMessageContent} onChange={(e) => setEditingMessage(editingMessageId, e.currentTarget.value)} />
          <div className={styles.editActions}>
            <Button variant="secondary" onClick={() => setEditingMessage(null)}>Cancel</Button>
            <Button variant="primary" onClick={saveEditedMessage}>Save</Button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={() => { }} />

      <MessageSearch
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
        onJumpToMessage={(id) => show(`Jumping to message ${id}`, 'success')}
      />

    </motion.div>
  )
}

