import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, UserPlus, UserX, Loader2, Users, Shield, MoreHorizontal } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../stores/useAuthStore'
import { useUserListStore } from '../../stores/useUserListStore'
import { useDMStore } from '../../stores/useDMStore'
import { Button, Modal, useToast, Tooltip } from '../ui'
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
  const [mutuals, setMutuals] = useState<{ friends: any[], guilds: any[] }>({ friends: [], guilds: [] })
  const [error, setError] = useState<string | null>(null)
  const [friendsReady, setFriendsReady] = useState(false)
  const [sendingFriendRequest, setSendingFriendRequest] = useState(false)
  const [openingDm, setOpeningDm] = useState(false)
  const [pendingRequestSent, setPendingRequestSent] = useState(false)

  const isFriend = friends.some((friend: any) => {
    const targetId = user?.id || userId
    if (friend?.id && targetId && friend.id === targetId) return true
    if (friend?.username && user?.username) {
      const sameUser = String(friend.username || '').toLowerCase() === String(user.username || '').toLowerCase()
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
    return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  const frameArt = user?.avatarDecorationId ? arts.find((a: ProfileArt) => a.id === user.avatarDecorationId) : null
  const profileEffectClass = user?.profileEffectId === 'effect-nebula-pulse'
    ? styles.effectNebula
    : user?.profileEffectId === 'effect-cyber-static'
      ? styles.effectCyber
      : ''

  useEffect(() => {
    const fetchUser = async (isSilent = false) => {
      if (!userId) return

      if (!isSilent) setLoading(true)
      setError(null)

      try {
        const response = await apiClient.request('GET', `/users/${userId}`)
        if (response.success && response.data) {
          const userData = {
            ...response.data,
            joinedAt: response.data.createdAt || new Date().toISOString(),
          }
          setUser(userData)

          // Fetch mutuals if not self
          if (!isSelf) {
            const mutualsRes = await apiClient.request('GET', `/users/${userId}/mutuals`)
            if (mutualsRes.success) {
              setMutuals(mutualsRes.data)
            }
          }

          const noteRes = await apiClient.request('GET', `/notes/profile/${userId}`)
          if (noteRes.success && noteRes.data?.note) {
            setProfileNote(noteRes.data.note)
          } else {
            setProfileNote(null)
          }
        } else if (!isSilent) {
          setError('User not found')
        }
      } catch (err) {
        if (!isSilent) setError('Failed to load user profile')
      } finally {
        if (!isSilent) setLoading(false)
      }
    }

    if (isOpen) {
      fetchUser()
      setFriendsReady(false)
      setPendingRequestSent(false)
      void fetchFriends().finally(() => setFriendsReady(true))

      // Real-time status/music sync
      const interval = setInterval(() => fetchUser(true), 10000)
      return () => clearInterval(interval)
    }
  }, [userId, isOpen, fetchFriends, isSelf])

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

  const resolveBannerUrl = (banner?: string | null) => {
    if (!banner) return null
    if (banner.startsWith('http') || banner.startsWith('https') || banner.startsWith('data:') || banner.startsWith('/')) return banner
    return `/art/banners/${banner}.png`
  }

  const bannerUrl = resolveBannerUrl(user.banner)

  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" noPadding hideHeader transparent>
      <div className={`${styles.container} ${profileEffectClass}`}>
        {/* Banner Area */}
        <div
          className={styles.banner}
          style={
            bannerUrl
              ? { 
                  backgroundImage: `url(${bannerUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                }
              : { background: 'linear-gradient(135deg, var(--beacon-brand) 0%, #7c3aed 50%, #f59e0b 100%)' }
          }
        >
          <div className={styles.bannerOverlay} />
          {user.profileEffectId && (
            <img 
              src={`/effects/${user.profileEffectId}.gif`} 
              className={styles.profileEffect} 
              alt="" 
            />
          )}
        </div>

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
          </div>

          <div className={styles.headerActions}>
            {canUseSocialActions && (
              <>
                {(isFriend || canSendFriendRequest) && (
                  <Tooltip content={isFriend ? 'Remove Friend' : 'Add Friend'}>
                    <Button
                      variant={isFriend ? 'danger' : 'primary'}
                      onClick={isFriend ? handleRemoveFriend : handleAddFriend}
                      size="sm"
                      className={styles.socialBtn}
                    >
                      {isFriend ? <UserX size={20} /> : <UserPlus size={20} />}
                    </Button>
                  </Tooltip>
                )}
                <Tooltip content={isBlocked ? 'Unblock' : 'Block'}>
                  <Button
                    variant={isBlocked ? 'danger' : 'secondary'}
                    onClick={handleToggleBlock}
                    size="sm"
                    className={styles.socialBtn}
                  >
                    <MoreHorizontal size={20} />
                  </Button>
                </Tooltip>
              </>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div className={styles.scrollArea}>
          <motion.div 
            className={styles.identitySection}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div style={{ position: 'absolute', top: 12, right: 16 }}>
              <UserBadges badges={user.badges} isBot={user.bot} size="sm" />
            </div>
            
            <h1 className={styles.username}>
              {user.displayName || user.username}
              {user.bot && <BotTag />}
            </h1>
            <p className={styles.handle}>@{user.username}{user.discriminator ? `#${user.discriminator}` : ''}</p>
            
            {user.customStatus && (
              <div className={styles.statusText}>{user.customStatus}</div>
            )}
          </motion.div>

          <motion.div 
            className={styles.sectionCard}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h3 className={styles.sectionHeader}>ABOUT ME</h3>
            <p className={styles.bioText}>{user.bio || 'No bio provided.'}</p>
          </motion.div>

          {!isSelf && (mutuals.friends.length > 0 || mutuals.guilds.length > 0) && (
            <motion.div 
              className={styles.sectionCard}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <h3 className={styles.sectionHeader}>MUTUALS</h3>
              <div style={{ display: 'flex', gap: '24px' }}>
                {mutuals.friends.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Users size={18} color="rgba(255,255,255,0.4)" />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{mutuals.friends.length} Friends</span>
                  </div>
                )}
                {mutuals.guilds.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <Shield size={18} color="rgba(255,255,255,0.4)" />
                    <span style={{ fontSize: '14px', fontWeight: 600 }}>{mutuals.guilds.length} Servers</span>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {(profileNote?.text || profileNote?.musicMetadata?.title) && (
            <motion.div 
              className={styles.sectionCard}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
            >
              <h3 className={styles.sectionHeader}>ACTIVITY</h3>
              {profileNote.text && (
                <div style={{ marginBottom: profileNote.musicMetadata?.title ? '16px' : '0' }}>
                  <p className={styles.bioText}>
                    <span style={{ marginRight: '8px', fontSize: '1.2em' }}>{profileNote.emoji || '✨'}</span>
                    {profileNote.text}
                  </p>
                </div>
              )}
              {profileNote.musicMetadata?.title && (
                <div className={styles.activityCard}>
                  <p className={styles.sectionHeader} style={{ fontSize: '10px', marginBottom: '10px' }}>SPOTIFY</p>
                  <div className={styles.musicActivity}>
                    <div className={styles.musicArt}>
                      <img 
                        src={profileNote.musicMetadata.coverArt || '/ui/music-placeholder.png'} 
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => (e.currentTarget.src = 'https://cdn-icons-png.flaticon.com/512/3844/3844724.png')}
                      />
                    </div>
                    <div className={styles.musicDetails}>
                      <span className={styles.musicTitle}>{profileNote.musicMetadata.title}</span>
                      <span className={styles.musicArtist}>{profileNote.musicMetadata.artist || 'Unknown Artist'}</span>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          <div className={styles.metaSection}>
            <span className={styles.metaLabel}>MEMBER SINCE</span>
            <span className={styles.metaValue}>{formatSafeDate(user.joinedAt)}</span>
          </div>
        </div>

        <div className={styles.actionFooter}>
          <Button variant="primary" onClick={handleMessage} className={styles.fullWidthMessageBtn}>
            {openingDm ? 'Opening...' : 'Send Message'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}