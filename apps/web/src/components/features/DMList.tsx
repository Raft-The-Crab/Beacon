import { useState } from 'react'
import { Search, Plus } from 'lucide-react'
import { Avatar, Input, Badge, Button, Modal } from '../ui'
import { useDMStore, DMChannel, DMParticipant } from '../../stores/useDMStore'
import { useAuthStore } from '../../stores/useAuthStore'
import styles from './DMList.module.css'

interface DMListProps {
  selectedDmId?: string
  onSelectDM: (dmId: string) => void
}

export function DMList({ selectedDmId, onSelectDM }: DMListProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [showNewDMModal, setShowNewDMModal] = useState(false)
  const [newDMUsername, setNewDMUsername] = useState('')
  
  const { user } = useAuthStore()
  const { channels, messages, createDMChannel, markAsRead } = useDMStore()

  const handleSelectDM = (dmId: string) => {
    onSelectDM(dmId)
    markAsRead(dmId)
  }

  const handleCreateDM = async () => {
    if (!newDMUsername.trim() || !user) return
    
    // In a real app, you'd search for the user by username via API
    // For now, we'll create a placeholder
    await createDMChannel({
      id: Date.now().toString(),
      username: newDMUsername,
      avatar: undefined,
      status: 'invisible',
    })
    
    setNewDMUsername('')
    setShowNewDMModal(false)
  }

  const getDMInfo = (channel: DMChannel) => {
    const otherUser = channel.participants.find((p: DMParticipant) => p.id !== user?.id)
    const channelMessages = messages.get(channel.id) || []
    const lastMessage = channelMessages[channelMessages.length - 1]
    
    return {
      name: otherUser?.username || 'Unknown User',
      avatar: otherUser?.avatar,
      status: otherUser?.status,
      lastMessage: lastMessage?.content,
      lastMessageTime: lastMessage
        ? new Date(lastMessage.timestamp).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })
        : undefined,
      unreadCount: channel.unreadCount,
    }
  }

  const filteredDMs = channels.filter((channel: DMChannel) => {
    const info = getDMInfo(channel)
    return info.name.toLowerCase().includes(searchQuery.toLowerCase())
  })

  return (
    <div className={styles.dmList}>
      <div className={styles.header}>
        <h3 className={styles.title}>Direct Messages</h3>
        <button
          className={styles.addButton}
          onClick={() => setShowNewDMModal(true)}
          title="New DM"
        >
          <Plus size={18} />
        </button>
      </div>

      <div className={styles.searchWrapper}>
        <Input
          placeholder="Search DMs..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.currentTarget.value)}
          icon={<Search size={16} />}
        />
      </div>

      <div className={styles.dmItems}>
        {filteredDMs.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No direct messages yet</p>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setShowNewDMModal(true)}
            >
              Start a conversation
            </Button>
          </div>
        ) : (
          filteredDMs.map((channel) => {
            const info = getDMInfo(channel)
            return (
              <button
                key={channel.id}
                className={`${styles.dmItem} ${
                  selectedDmId === channel.id ? styles.active : ''
                }`}
                onClick={() => handleSelectDM(channel.id)}
              >
                <Avatar src={info.avatar} size="md" status={info.status} />
                <div className={styles.dmInfo}>
                  <div className={styles.dmName}>
                    {info.name}
                    {info.unreadCount > 0 && (
                      <Badge variant="info" size="sm">
                        {info.unreadCount}
                      </Badge>
                    )}
                  </div>
                  <p className={styles.lastMessage}>
                    {info.lastMessage || 'No messages yet'}
                  </p>
                </div>
                {info.lastMessageTime && (
                  <span className={styles.timestamp}>{info.lastMessageTime}</span>
                )}
              </button>
            )
          })
        )}
      </div>

      {/* New DM Modal */}
      <Modal
        isOpen={showNewDMModal}
        onClose={() => {
          setShowNewDMModal(false)
          setNewDMUsername('')
        }}
        title="Start a Direct Message"
      >
        <div className={styles.newDMModal}>
          <Input
            placeholder="Enter username..."
            value={newDMUsername}
            onChange={(e) => setNewDMUsername(e.currentTarget.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleCreateDM()
              }
            }}
          />
          <div className={styles.modalActions}>
            <Button
              variant="secondary"
              onClick={() => {
                setShowNewDMModal(false)
                setNewDMUsername('')
              }}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={handleCreateDM}
              disabled={!newDMUsername.trim()}
            >
              Create DM
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
