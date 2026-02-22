import { useState, useEffect } from 'react'
import { MessageCircle, UserPlus, UserX, X, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUserListStore } from '../../stores/useUserListStore'
import { useDMStore } from '../../stores/useDMStore'
import { useUIStore } from '../../stores/useUIStore'
import { Button, Modal, useToast } from '../ui'
import { Avatar } from '../ui/Avatar'
import styles from './UserProfileModal.module.css'

interface UserProfileModalProps {
  userId: string
  isOpen: boolean
  onClose: () => void
}

export function UserProfileModal({ userId, isOpen, onClose }: UserProfileModalProps) {
  const navigate = useNavigate()
  const { show: showToast } = useToast()
  const { user: currentUser } = useAuthStore()
  const { friends, blockedUsers, addFriend, removeFriend, blockUser, unblockUser } = useUserListStore()
  const { createDMChannel, setActiveChannel } = useDMStore()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const isFriend = friends.some(f => f.id === userId)
  const isBlocked = blockedUsers.includes(userId || '')

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return

      setLoading(true)
      setError(null)

      try {
        // Simulated API call for user profile
        await new Promise(resolve => setTimeout(resolve, 600))

        setUser({
          id: userId,
          username: `User ${userId.slice(0, 8)}`,
          email: 'user@beacon.local',
          avatar: undefined,
          customStatus: 'Using Beacon',
          joinedAt: '2024-01-15',
          status: 'online',
          discriminator: '0000',
        })
      } catch (err) {
        setError('An error occurred while loading user profile')
      } finally {
        setLoading(false)
      }
    }

    if (isOpen) {
      fetchUser()
    }
  }, [userId, isOpen])

  const handleAddFriend = async () => {
    if (!user) return

    try {
      addFriend({
        ...user,
        status: user.status || 'online',
      })
      showToast(`Sent friend request to ${user.username}`, 'success')
    } catch (err) {
      showToast('Failed to add friend', 'error')
    }
  }

  const handleRemoveFriend = async () => {
    if (!userId) return

    try {
      removeFriend(userId)
      showToast(`Removed ${user?.username} from friends`, 'info')
    } catch (err) {
      showToast('Failed to remove friend', 'error')
    }
  }

  const handleToggleBlock = async () => {
    if (!userId) return

    try {
      if (isBlocked) {
        unblockUser(userId)
        showToast(`Unblocked ${user?.username}`, 'success')
      } else {
        blockUser(userId)
        showToast(`Blocked ${user?.username}`, 'info')
      }
    } catch (err) {
      showToast('Action failed', 'error')
    }
  }

  const handleMessage = async () => {
    if (!user) return

    try {
      // Create DM channel with this user
      await createDMChannel({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: user.status || 'online',
      })

      // Navigate to MessagingHome and set the active channel
      setActiveChannel(user.id)
      navigate('/app')
      onClose()
    } catch (err) {
      showToast('Failed to open conversation', 'error')
    }
  }

  if (loading) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
        <div className={styles.loading}>
          <Loader2 size={32} className={styles.spinner} />
          <p>Loading profile...</p>
        </div>
      </Modal>
    )
  }

  if (error || !user) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="User Profile">
        <div className={styles.error}>
          <p>{error || 'User not found'}</p>
        </div>
      </Modal>
    )
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" noPadding hideHeader>
      <div className={styles.container}>
        <div className={styles.banner} />

        <div className={styles.profileCard}>
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              <Avatar
                src={user.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined}
                username={user.username}
                status={user.status as any}
                size="lg"
              />
              <div className={`${styles.statusBadge} ${user.status || 'offline'}`} />
            </div>
          </div>

          <div className={styles.info}>
            <h1 className={styles.username}>
              {user.username}
              <span className={styles.discriminator}>#{user.discriminator || '0000'}</span>
            </h1>
            {user.customStatus && <p className={styles.customStatus}>{user.customStatus}</p>}
          </div>

          {currentUser?.id !== userId && (
            <div className={styles.actions}>
              <Button variant="primary" onClick={handleMessage} fullWidth>
                <MessageCircle size={18} />
                Message
              </Button>
              <div className={styles.buttonGroup}>
                <Button
                  variant={isFriend ? 'secondary' : 'primary'}
                  onClick={isFriend ? handleRemoveFriend : handleAddFriend}
                  fullWidth
                >
                  {isFriend ? <UserX size={18} /> : <UserPlus size={18} />}
                  {isFriend ? 'Remove Friend' : 'Add Friend'}
                </Button>
                <Button
                  variant={isBlocked ? 'danger' : 'secondary'}
                  onClick={handleToggleBlock}
                  size="sm"
                >
                  <X size={18} />
                </Button>
              </div>
            </div>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3>BEACON MEMBER SINCE</h3>
            <p>{new Date(user.joinedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}