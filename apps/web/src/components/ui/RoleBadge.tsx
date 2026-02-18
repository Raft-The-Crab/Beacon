import * as LucideIcons from 'lucide-react'
import styles from './RoleBadge.module.css'

interface RoleBadgeProps {
  name: string
  color: string
  icon?: string
  size?: 'sm' | 'md' | 'lg'
  showName?: boolean
  onClick?: () => void
}

export function RoleBadge({
  name,
  color,
  icon,
  size = 'md',
  showName = true,
  onClick
}: RoleBadgeProps) {
  // Get the icon component from lucide-react
  const IconComponent = icon && icon in LucideIcons
    ? (LucideIcons as any)[icon]
    : null

  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 16

  return (
    <div
      className={`${styles.badge} ${styles[size]} ${onClick ? styles.clickable : ''}`}
      style={{ backgroundColor: `${color}20`, borderColor: color }}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {IconComponent && (
        <IconComponent
          size={iconSize}
          style={{ color }}
          className={styles.icon}
        />
      )}
      {showName && (
        <span className={styles.name} style={{ color }}>
          {name}
        </span>
      )}
    </div>
  )
}
