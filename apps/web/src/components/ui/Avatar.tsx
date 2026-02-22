import { PresenceStatus } from '../../stores/useAuthStore'
import styles from './Avatar.module.css'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: PresenceStatus | 'offline'
  onClick?: () => void
  username?: string
}

const statusColors: Record<string, string> = {
  online: '#23a559',
  idle: '#f0b232',
  dnd: '#f23f43',
  invisible: '#80848e',
  offline: '#80848e',
}

// Generate a stable gradient from a string (no external service)
function stringToGradient(str: string): { bg: string; text: string } {
  const palettes = [
    { bg: 'linear-gradient(135deg, #5865f2 0%, #7289da 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #23a559 0%, #2da652 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #f0b232 0%, #e67e22 100%)', text: '#fff' },
    { bg: 'linear-gradient(135deg, #f23f43 0%, #c0392b 100%)', text: '#fff' },
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

export function Avatar({
  src,
  alt = '',
  size = 'md',
  status,
  onClick,
  username,
}: AvatarProps) {
  const displayName = username || alt || ''
  const { bg, text } = stringToGradient(displayName)
  const initials = getInitials(displayName)

  // Only show image if src is a real user-uploaded URL (not DiceBear)
  const showImage = !!src && !src.includes('dicebear') && !src.includes('api.dicebear')

  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      <div className={styles.inner}>
        {showImage ? (
          <img
            src={src!}
            alt={alt}
            className={styles.image}
            onError={(e) => {
              // Fallback: hide broken image, show initials below
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
}
