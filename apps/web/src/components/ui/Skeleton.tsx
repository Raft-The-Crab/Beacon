import styles from './Skeleton.module.css'

interface SkeletonProps {
  width?: string | number
  height?: string | number
  borderRadius?: string | number
  className?: string
}

export function Skeleton({ width, height, borderRadius, className }: SkeletonProps) {
  return (
    <div
      className={`${styles.skeleton} ${className || ''}`}
      style={{
        width: width ?? '100%',
        height: height ?? 16,
        borderRadius: borderRadius ?? 'var(--radius-sm)',
      }}
    />
  )
}

export function SkeletonMessage() {
  return (
    <div className={styles.message}>
      <Skeleton width={36} height={36} borderRadius="50%" />
      <div className={styles.messageBody}>
        <div className={styles.messageHeader}>
          <Skeleton width={120} height={14} />
          <Skeleton width={60} height={11} />
        </div>
        <Skeleton height={14} />
        <Skeleton width="70%" height={14} />
      </div>
    </div>
  )
}

export function SkeletonChannel() {
  return (
    <div className={styles.channel}>
      <Skeleton width={16} height={16} borderRadius={4} />
      <Skeleton width="65%" height={13} />
    </div>
  )
}

export function SkeletonServerIcon() {
  return <Skeleton width={48} height={48} borderRadius={16} />
}
