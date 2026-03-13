import { useState, useEffect } from 'react'
import { MessageCircle, UserPlus, UserX, Loader2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUserListStore } from '../../stores/useUserListStore'
import { useDMStore } from '../../stores/useDMStore'
import { Button, Modal, useToast } from '../ui'
import { Avatar } from '../ui/Avatar'
import { UserBadges, BotTag } from '../ui/UserBadges'
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
  const { friends, blockedUsers, fetchFriends, removeFriend, blockUser, unblockUser } = useUserListStore()
  const { createDMChannel, setActiveChannel } = useDMStore()

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [profileNote, setProfileNote] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)
  const [friendsReady, setFriendsReady] = useState(false)
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false)
  const [openingDm, setOpeningDm] = useState(false)
  const [pendingRequestSent, setPendingRequestSent] = useState(false)

  const isFriend = friends.some((friend: any) => {
    const targetId = user?.id || userId
    if (friend?.id && targetId && friend.id === targetId) return true
    if (friend?.username && user?.username) {
      const sameUser = friend.username.toLowerCase() === user.username.toLowerCase()
      const sameDiscriminator = String(friend.discriminator || '0000') === String(user.discriminator || '0000')
      if (sameUser && sameDiscriminator) return true
    }
    return false
  })
  const isBlocked = blockedUsers.includes(userId || '')

  // Profile art
  const { arts } = useProfileArtStore()
  const isSelf = !!currentUser && (currentUser.id === userId || currentUser.id === user?.id)
  const canUseSocialActions = !!currentUser && !!user && !isSelf && friendsReady
  const canSendFriendRequest = canUseSocialActions && !isFriend && !pendingRequestSent

  const formatSafeDate = (value?: string) => {
    if (!value) return 'Unknown'
    const parsed = new Date(value)
    if (Number.isNaN(parsed.getTime())) return 'Unknown'
    return parsed.toLocaleDateString()
  }

  const frameArt = user?.avatarDecorationId ? arts.find((a: ProfileArt) => a.id === user.avatarDecorationId) : null

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
      setFriendsReady(false)
      setPendingRequestSent(false)
      void fetchFriends().finally(() => setFriendsReady(true))
    }
  }, [userId, isOpen, fetchFriends])

  const handleAddFriend = async () => {
    if (!user || sendingFriendRequest || pendingRequestSent || isFriend) return

    if (isSelf) {
      showToast('You cannot add yourself as a friend', 'warning')
      return
    }

    try {
      setSendingFriendRequest(true)
      const payload = user.discriminator
        ? { username: user.username, discriminator: user.discriminator }
        : { username: user.username }
      const response = await apiClient.request('POST', '/friends/request', payload)
      if (!response.success) {
        const errMsg = String(response.error || '').toLowerCase()
        if (errMsg.includes('already') || errMsg.includes('pending') || errMsg.includes('exists')) {
          setPendingRequestSent(true)
          await fetchFriends()
          showToast('Friend request is already pending or connected.', 'info')
          return
        }
        showToast(response.error || 'Failed to send friend request', 'error')
        return
      }
      setPendingRequestSent(true)
      showToast(`Sent friend request to ${user.displayName || user.username}`, 'success')
      await fetchFriends()
    } catch (err) {
      showToast('Failed to add friend', 'error')
    } finally {
      setSendingFriendRequest(false)
    }
  }

  const handleRemoveFriend = async () => {
    if (!userId) return

    try {
      await apiClient.request('DELETE', `/friends/${userId}`)
      removeFriend(userId)
      await fetchFriends()
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
    if (!user || openingDm) return

    if (isSelf) {
      showToast('Open your own DM list from Home instead', 'info')
      return
    }

    try {
      setOpeningDm(true)
      const existingDM = useDMStore.getState().channels.find((channel: any) =>
        Array.isArray(channel.participants) &&
        channel.participants.some((participant: any) => participant.id === user.id) &&
        channel.participants.length === 2
      )

      if (existingDM) {
        setActiveChannel(existingDM.id)
        navigate('/channels/@me')
        onClose()
        return
      }

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
    } finally {
      setOpeningDm(false)
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
    <Modal isOpen={isOpen} onClose={onClose} size="md" noPadding hideHeader transparent>
      <div className={styles.container}>
        {/* Banner */}
        <div
          className={styles.banner}
          style={
            user.banner
              ? { backgroundImage: `url(${user.banner})`, backgroundSize: 'cover', backgroundPosition: 'center' }
              : { background: 'linear-gradient(135deg, #4a00e0 0%, #7b2ff7 50%, #c471ed 100%)' }
          }
        />
        <div className={styles.profileCard}>
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
              {user.displayName || user.username}
              {user.bot && <BotTag />}
            </h1>
            <p className={styles.handle}>@{user.username}{user.discriminator ? `#${user.discriminator}` : ''}</p>
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
                {openingDm ? 'Opening...' : 'Message'}
              </Button>
              {!user.bot && (
                <div className={styles.buttonGroup}>
                  {(isFriend || canSendFriendRequest) && (
                    <Button
                      variant={isFriend ? 'secondary' : 'primary'}
                      onClick={isFriend ? handleRemoveFriend : handleAddFriend}
                      fullWidth
                    >
                      {isFriend ? <UserX size={18} /> : <UserPlus size={18} />}
                      {isFriend ? 'Remove Friend' : sendingFriendRequest ? 'Sending...' : 'Add Friend'}
                    </Button>
                  )}
                  {!isFriend && pendingRequestSent && (
                    <Button variant="secondary" fullWidth>
                      Pending Request
                    </Button>
                  )}
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
            <p>{formatSafeDate(user.joinedAt)}</p>
          </div>
        </div>
      </div>
    </Modal>
  )
}