import React from 'react'
import { useAuthStore, PresenceStatus } from '../../stores/useAuthStore'
import { getSimulatedFrameForUser, useProfileArtStore } from '../../stores/useProfileArtStore'
import styles from '../../styles/modules/ui/Avatar.module.css'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'huge'
  status?: PresenceStatus | 'offline'
  onClick?: () => void
  username?: string
  frameUrl?: string | null
  frameGradient?: string | null
  frameAnimation?: string | null
  avatarDecorationId?: string | null
  speaking?: boolean
}

const statusColors: Record<string, string> = {
  online: 'var(--status-success)',
  idle: '#f0b232',
  dnd: 'var(--status-error)',
  invisible: '#80848e',
  offline: '#80848e',
}

// Generate a stable gradient from a string (no external service)
function stringToGradient(str: string): { bg: string; text: string } {
  const palettes = [
    { bg: 'linear-gradient(135deg, var(--beacon-brand) 0%, #7289da 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, var(--status-success) 0%, #2da652 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #f0b232 0%, #e67e22 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, var(--status-error) 0%, #c0392b 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #9b59b6 0%, #8e44ad 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #1abc9c 0%, #16a085 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #e91e8c 0%, #c2185b 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #ff6b35 0%, #e55116 100%)', text: '#fff' },
  ]
  if (!str) return palettes[0]
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i)
    hash |= 0
  }
  return palettes[Math.abs(hash) % palettes.length]
}

function getInitials(name?: string | null): string {
  if (!name || name.trim() === '') return '?'
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return name.substring(0, 2).toUpperCase()
}

export const Avatar = React.memo(function Avatar({
  src,
  alt = '',
  size = 'md',
  status,
  username,
  frameUrl,
  frameGradient,
  frameAnimation,
  avatarDecorationId,
  speaking = false,
}: AvatarProps) {
  const currentUser = useAuthStore(state => state.user)
  const { arts, equippedFrame } = useProfileArtStore()

  const isOtherUser = username && username !== currentUser?.username && username !== 'You'
  const simulatedArt = isOtherUser ? getSimulatedFrameForUser(username) : null
  const currentUserArt = !isOtherUser ? arts.find(a => a.id === equippedFrame) : null

  const finalFrameUrl = frameUrl !== undefined ? frameUrl : (simulatedArt?.imageUrl || currentUserArt?.imageUrl)
  const finalFrameGradient = frameGradient !== undefined ? frameGradient : (simulatedArt?.preview || currentUserArt?.preview)
  const finalFrameAnimation = frameAnimation !== undefined ? frameAnimation : (simulatedArt?.animation || currentUserArt?.animation)
  const shouldAnimateFrame = !!finalFrameAnimation && !finalFrameUrl

  const displayName = username || alt || ''
  const { bg, text } = stringToGradient(displayName)
  const initials = getInitials(displayName)

  const showImage = !!src && !src.includes('dicebear') && !src.includes('api.dicebear')
  const hasFrame = !!(finalFrameUrl || finalFrameGradient)

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${hasFrame ? styles.framed : ''} ${speaking ? styles.speaking : ''}`}
    >
      {/* Profile Art Frame */}
      {hasFrame && (
        <div className={`${styles.frameRing} ${shouldAnimateFrame ? styles[`anim-${finalFrameAnimation}`] : ''}`}>
          {finalFrameUrl ? (
            <img src={finalFrameUrl} alt="frame" className={styles.frameImage} />
          ) : finalFrameGradient ? (
            <div className={styles.frameGradient} style={{ background: finalFrameGradient }} />
          ) : null}
        </div>
      )}


      <div className={styles.inner}>
        {showImage ? (
          <img
            src={src!}
            alt={alt}
            className={styles.image}
            onError={(e) => {
              const target = e.currentTarget
              target.style.display = 'none'
            }}
          />
        ) : (
          <div
            className={styles.placeholder}
            style={{ background: bg, color: text }}
          >
            {initials}
          </div>
        )}
      </div>
      {status && status !== 'invisible' && (
        <span
          className={styles.status}
          style={{ backgroundColor: statusColors[status] ?? statusColors.offline }}
        />
      )}
    </div>
  )
})
