import { useState, useEffect } from 'react'
import { MessageCircle, UserPlus, UserX, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUserListStore } from '../../stores/useUserListStore'
import { useDMStore } from '../../stores/useDMStore'
import { Button, Modal, useToast } from '../ui'
import { Avatar } from '../ui/Avatar'
import { UserBadges, BotTag } from '../ui/UserBadges'
import { ProfileArtPicker } from '../features/ProfileArtPicker'
import { useProfileArtStore, type ProfileArt } from '../../stores/useProfileArtStore'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/modals/UserProfileModal.module.css'

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
  const [profileNote, setProfileNote] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const isFriend = friends.some(f => f.id === userId)
  const isBlocked = blockedUsers.includes(userId || '')

  // Profile art
  const { arts } = useProfileArtStore()
  const isSelf = !!currentUser && (currentUser.id === userId || currentUser.id === user?.id)
  const canUseSocialActions = !!currentUser && !!user && !isSelf

  const frameArt = user?.avatarDecorationId ? arts.find((a: ProfileArt) => a.id === user.avatarDecorationId) : null
  const bannerArt = user?.banner ? (arts.find((a: ProfileArt) => a.id === user.banner) || ({ preview: `url(${user.banner}) center/cover no-repeat` } as any)) : null
  const effectArt = user?.profileEffectId ? arts.find((a: ProfileArt) => a.id === user.profileEffectId) : null

  useEffect(() => {
    const fetchUser = async () => {
      if (!userId) return

      setLoading(true)
      setError(null)

      try {
        const response = await apiClient.request('GET', `/users/${userId}`)
        if (response.success && response.data) {
          setUser({
            ...response.data,
            joinedAt: response.data.createdAt || new Date().toISOString(),
          })

          const noteRes = await apiClient.request('GET', `/notes/profile/${userId}`)
          if (noteRes.success && noteRes.data?.note) {
            setProfileNote(noteRes.data.note)
          } else {
            setProfileNote(null)
          }
        } else {
          setError('User not found')
        }
      } catch (err) {
        setError('Failed to load user profile')
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

    if (isSelf) {
      showToast('You cannot add yourself as a friend', 'warning')
      return
    }

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

    if (isSelf) {
      showToast('Open your own DM list from Home instead', 'info')
      return
    }

    try {
      // Create DM channel with this user
      const dmChannelId = await createDMChannel({
        id: user.id,
        username: user.username,
        avatar: user.avatar,
        status: user.status || 'online',
      })

      // Navigate to MessagingHome and set the active channel
      setActiveChannel(dmChannelId)
      navigate('/channels/@me')
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
        <div
          className={styles.banner}
          style={bannerArt ? { background: (bannerArt as any).imageUrl ? `url(${(bannerArt as any).imageUrl}) center/cover no-repeat` : bannerArt.preview } : undefined}
        />

        <div className={`${styles.profileCard} ${effectArt ? styles.hasEffect : ''}`}>
          {effectArt && <div className={`${styles.profileEffect} ${styles[effectArt.animation || '']}`} />}
          <div className={styles.profileHeader}>
            <div className={styles.avatarWrapper}>
              <Avatar
                src={user.avatar && !user.avatar.includes('dicebear') ? user.avatar : undefined}
                username={user.username}
                status={user.status as any}
                size="lg"
                frameUrl={frameArt?.imageUrl}
                frameGradient={!frameArt?.imageUrl ? frameArt?.preview : undefined}
              />
              <div className={`${styles.statusBadge} ${user.status || 'offline'}`} />
            </div>
          </div>

          <div className={styles.info}>
            <h1 className={styles.username}>
              {user.username}
              {user.bot && <BotTag />}
              <span className={styles.discriminator}>#{user.discriminator || '0000'}</span>
            </h1>
            <UserBadges badges={user.badges} isBot={user.bot} size="md" />
            {user.customStatus && <p className={styles.customStatus}>{user.customStatus}</p>}
            {profileNote && (profileNote.text || profileNote.musicMetadata?.title) && (
              <div className={styles.noteBubble}>
                <div className={styles.noteEmoji}>{profileNote.emoji || '✨'}</div>
                <div className={styles.noteContent}>
                  {profileNote.text && <p className={styles.noteText}>{profileNote.text}</p>}
                  {profileNote.musicMetadata?.title && (
                    <p className={styles.noteMusic}>Listening to {profileNote.musicMetadata.title}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {canUseSocialActions && (
            <div className={styles.actions}>
              <Button variant="primary" onClick={handleMessage} fullWidth>
                <MessageCircle size={18} />
                Message
              </Button>
              {!user.bot && (
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
                    fullWidth
                  >
                    <UserX size={18} />
                    {isBlocked ? 'Unblock' : 'Block'}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        <div className={styles.body}>
          <div className={styles.section}>
            <h3>BEACON MEMBER SINCE</h3>
            <p>{new Date(user.joinedAt).toLocaleDateString()}</p>
          </div>
          {isSelf && (
            <div className={styles.section}>
              <ProfileArtPicker />
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}