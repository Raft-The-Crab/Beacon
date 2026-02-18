import styles from './LoadingStates.module.css'

interface SkeletonProps {
  width?: string
  height?: string
  circle?: boolean
  count?: number
  className?: string
}

export function Skeleton({ width, height = '16px', circle, count = 1, className }: SkeletonProps) {
  const skeletons = Array.from({ length: count }, (_, i) => (
    <div
      key={i}
      className={`${styles.skeleton} ${circle ? styles.circle : ''} ${className || ''}`}
      style={{
        width: circle ? height : width,
        height,
      }}
    />
  ))

  return count > 1 ? <div className={styles.skeletonGroup}>{skeletons}</div> : skeletons[0]
}

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  variant?: 'primary' | 'secondary'
  label?: string
}

export function Spinner({ size = 'md', variant = 'primary', label }: SpinnerProps) {
  return (
    <div className={styles.spinnerContainer}>
      <div className={`${styles.spinner} ${styles[size]} ${styles[variant]}`} />
      {label && <span className={styles.spinnerLabel}>{label}</span>}
    </div>
  )
}

interface LoadingDotsProps {
  size?: 'sm' | 'md' | 'lg'
}

export function LoadingDots({ size = 'md' }: LoadingDotsProps) {
  return (
    <div className={`${styles.dots} ${styles[`dots${capitalize(size)}`]}`}>
      <span />
      <span />
      <span />
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  showLabel?: boolean
  variant?: 'primary' | 'success' | 'warning' | 'danger'
}

export function ProgressBar({ progress, showLabel, variant = 'primary' }: ProgressBarProps) {
  const clampedProgress = Math.min(100, Math.max(0, progress))

  return (
    <div className={styles.progressContainer}>
      <div className={styles.progressBar}>
        <div
          className={`${styles.progressFill} ${styles[variant]}`}
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
      {showLabel && <span className={styles.progressLabel}>{Math.round(clampedProgress)}%</span>}
    </div>
  )
}

interface LoadingOverlayProps {
  message?: string
  transparent?: boolean
}

export function LoadingOverlay({ message = 'Loading...', transparent }: LoadingOverlayProps) {
  return (
    <div className={`${styles.overlay} ${transparent ? styles.transparent : ''}`}>
      <div className={styles.overlayContent}>
        <Spinner size="lg" />
        <span className={styles.overlayMessage}>{message}</span>
      </div>
    </div>
  )
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1)
}
