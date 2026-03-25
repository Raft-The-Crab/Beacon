import styles from '../../styles/modules/ui/Badge.module.css'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info' | 'beacon-plus'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  onClick?: () => void
  style?: React.CSSProperties
  className?: string
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  icon, 
  onClick,
  style,
  className 
}: BadgeProps) {
  return (
    <span 
      className={`${styles.badge} ${styles[variant]} ${styles[size]} ${onClick ? styles.clickable : ''} ${className || ''}`}
      style={style}
      onClick={onClick}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  )
}
