import styles from './Badge.module.css'

interface BadgeProps {
  children: React.ReactNode
  variant?: 'default' | 'success' | 'error' | 'warning' | 'info'
  size?: 'sm' | 'md' | 'lg'
  icon?: React.ReactNode
  onClick?: () => void
  className?: string
}

export function Badge({ 
  children, 
  variant = 'default', 
  size = 'md', 
  icon, 
  onClick,
  className 
}: BadgeProps) {
  return (
    <span 
      className={`${styles.badge} ${styles[variant]} ${styles[size]} ${onClick ? styles.clickable : ''} ${className || ''}`}
      onClick={onClick}
    >
      {icon && <span className={styles.icon}>{icon}</span>}
      {children}
    </span>
  )
}
