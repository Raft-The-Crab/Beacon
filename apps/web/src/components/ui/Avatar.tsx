import { PresenceStatus } from '../../stores/useAuthStore'
import styles from './Avatar.module.css'

interface AvatarProps {
  src?: string | null
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  status?: PresenceStatus
  onClick?: () => void
}

const statusColors: Record<PresenceStatus, string> = {
  online: 'var(--status-success)',
  idle: 'var(--status-warning)',
  dnd: 'var(--status-error)',
  invisible: 'var(--text-muted)',
}

export function Avatar({ src, alt = '', size = 'md', status, onClick }: AvatarProps) {


  return (
    <div
      className={`${styles.avatar} ${styles[size]} ${onClick ? styles.clickable : ''}`}
      onClick={onClick}
    >
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : (
        <div className={styles.placeholder}>
          <svg viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>
      )}
      {status && (
        <span
          className={styles.status}
          style={{ backgroundColor: statusColors[status] }}
        />
      )}
    </div>
  )
}
