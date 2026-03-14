import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styles from '../../styles/modules/animations/CrateAnimation.module.css'

interface CrateAnimationProps {
  isOpen: boolean
  onComplete?: () => void
  reward?: {
    icon: string | React.ReactNode
    label: string
    amount?: number
  }
}

export function CrateAnimation({ isOpen, onComplete, reward }: CrateAnimationProps) {
  const prefersReducedMotion = useReducedMotion()

  const confettiParticles = useMemo(
    () =>
      Array.from({ length: prefersReducedMotion ? 0 : 14 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 420,
        y: 280 + Math.random() * 150,
        rotate: (Math.random() - 0.5) * 900,
        delay: Math.random() * 0.18,
        duration: 1.3 + Math.random() * 0.35,
      })),
    [prefersReducedMotion]
  )

  const sparkleBursts = useMemo(
    () =>
      Array.from({ length: prefersReducedMotion ? 3 : 10 }, (_, i) => ({
        id: i,
        radius: prefersReducedMotion ? 52 : 66 + Math.random() * 24,
        delay: 1 + i * 0.04,
      })),
    [prefersReducedMotion]
  )

  return (
    <div className={styles.container}>
      <div className={styles.backdropVignette} />

      {isOpen && (
        <>
          {confettiParticles.map((particle) => (
            <motion.div
              key={`confetti-${particle.id}`}
              className={styles.confetti}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : {
                      x: particle.x,
                      y: particle.y,
                      opacity: [1, 1, 0],
                      rotate: particle.rotate,
                    }
              }
              transition={{ duration: particle.duration, ease: 'easeOut', delay: particle.delay }}
            />
          ))}
        </>
      )}

      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: prefersReducedMotion ? 0.12 : 0.28 }}
        className={styles.glow}
      />

      <motion.div
        className={styles.crateWrapper}
        initial={{ rotateX: 0, rotateY: 0, y: 0 }}
        animate={
          isOpen
            ? {
                rotateX: prefersReducedMotion ? [0, -10, 0] : [-40, -76, 0],
                rotateY: prefersReducedMotion ? [0, 10, 0] : [26, 64, 0],
                y: prefersReducedMotion ? [-8, -14, 0] : [-24, -56, 0],
                opacity: [1, 0.85, 0],
              }
            : { rotateX: 0, rotateY: 0, y: 0, opacity: 1 }
        }
        transition={{ duration: prefersReducedMotion ? 0.45 : 1.05, ease: 'backOut' }}
      >
        <motion.div
          className={styles.crate}
          initial={{ rotateX: 0, rotateY: 0 }}
          animate={
            isOpen
              ? {
                  rotateX: prefersReducedMotion ? [0, -10, -8] : [0, -58, -42],
                  rotateY: prefersReducedMotion ? [0, 8, 4] : [-10, 42, 24],
                  scale: prefersReducedMotion ? [1, 0.98, 0.94] : [1, 0.95, 0.8],
                }
              : { rotateX: 0, rotateY: 0, scale: 1 }
          }
          transition={{ duration: prefersReducedMotion ? 0.45 : 1.05, ease: 'easeInOut' }}
        >
          <div className={styles.crateTop} />
          <div className={styles.crateFront} />
          <div className={styles.crateLeft} />
          <div className={styles.crateRight} />
        </motion.div>
      </motion.div>

      <motion.div
        className={styles.lightRays}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={
          isOpen
            ? {
                opacity: prefersReducedMotion ? [0, 0.35, 0.2] : [0, 1, 0.6],
                scale: prefersReducedMotion ? [0.9, 1, 1] : [0.5, 1.2, 1],
              }
            : { opacity: 0, scale: 0.5 }
        }
        transition={{ duration: prefersReducedMotion ? 0.4 : 1.2, delay: prefersReducedMotion ? 0.05 : 0.2 }}
      />

      <motion.div
        className={styles.shockwave}
        initial={{ scale: 0.3, opacity: 1 }}
        animate={
          isOpen
            ? { scale: prefersReducedMotion ? 1.2 : 2.5, opacity: 0 }
            : { scale: 0.3, opacity: 0 }
        }
        transition={{ duration: prefersReducedMotion ? 0.25 : 0.8, delay: prefersReducedMotion ? 0.06 : 0.3, ease: 'easeOut' }}
      />

      {isOpen && reward && (
        <>
          <motion.div
            className={styles.rewardGlow}
            initial={{ opacity: 0, scale: 1.5 }}
            animate={
              prefersReducedMotion
                ? { opacity: [0, 0.35, 0], scale: [1.05, 1, 0.98] }
                : { opacity: [0, 0.8, 0], scale: [1.5, 1.2, 1] }
            }
            transition={{ duration: prefersReducedMotion ? 0.4 : 1.1, delay: prefersReducedMotion ? 0.16 : 0.62 }}
          />

          <motion.div
            className={styles.rewardContainer}
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={
              prefersReducedMotion
                ? { scale: [0.92, 1], y: [12, 0], opacity: [0, 1] }
                : { scale: [0, 1.24, 1], y: [50, -18, 0], opacity: [0, 1, 1] }
            }
            transition={{ duration: prefersReducedMotion ? 0.4 : 0.92, delay: prefersReducedMotion ? 0.22 : 0.74, ease: 'backOut' }}
            onAnimationComplete={onComplete}
          >
            <motion.div
              className={styles.rewardIcon}
              animate={{
                rotateY: prefersReducedMotion ? 0 : 360,
                y: prefersReducedMotion ? [0, -4, 0] : [0, -12, 0],
                scale: prefersReducedMotion ? [1, 1.02, 1] : [1, 1.08, 1],
              }}
              transition={{
                rotateY: { duration: 2.1, repeat: Infinity, ease: 'linear' },
                y: { duration: prefersReducedMotion ? 1.9 : 2.1, repeat: Infinity, ease: 'easeInOut' },
                scale: { duration: prefersReducedMotion ? 1.9 : 2.1, repeat: Infinity, ease: 'easeInOut' },
              }}
            >
              {reward.icon}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: prefersReducedMotion ? 0.4 : 1.3, duration: 0.35 }}
              className={styles.rewardLabel}
            >
              <p className={styles.rewardName}>{reward.label}</p>
              {reward.amount && <span className={styles.amount}>+{reward.amount.toLocaleString()}</span>}
            </motion.div>

            {sparkleBursts.map((burst) => (
              <motion.div
                key={`sparkle-${burst.id}`}
                className={styles.sparkle}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((burst.id / sparkleBursts.length) * Math.PI * 2) * burst.radius,
                  y: Math.sin((burst.id / sparkleBursts.length) * Math.PI * 2) * burst.radius,
                }}
                transition={{ duration: prefersReducedMotion ? 0.7 : 1.2, delay: burst.delay }}
              />
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}
