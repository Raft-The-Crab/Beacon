import { motion } from 'framer-motion'
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

  return (
    <div className={styles.container}>
      {/* Background confetti effect */}
      {isOpen && (
        <>
          {Array.from({ length: 12 }).map((_, i) => (
            <motion.div
              key={`confetti-${i}`}
              className={styles.confetti}
              initial={{ x: 0, y: 0, opacity: 1, rotate: 0 }}
              animate={{
                x: (Math.random() - 0.5) * 400,
                y: 300 + Math.random() * 100,
                opacity: [1, 1, 0],
                rotate: Math.random() * 720
              }}
              transition={{ duration: 1.5, ease: 'easeOut', delay: Math.random() * 0.2 }}
            />
          ))}
        </>
      )}

      {/* Main glow effect */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={isOpen ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0 }}
        transition={{ duration: 0.3 }}
        className={styles.glow}
      />

      {/* Crate container */}
      <motion.div
        className={styles.crateWrapper}
        initial={{ rotateX: 0, rotateY: 0, y: 0 }}
        animate={
          isOpen
            ? { rotateX: [-50, -80, 0], rotateY: [30, 60, 0], y: [-30, -60, 0], opacity: [1, 0.8, 0] }
            : { rotateX: 0, rotateY: 0, y: 0, opacity: 1 }
        }
        transition={{ duration: 1.2, ease: 'backOut' }}
      >
        <motion.div
          className={styles.crate}
          initial={{ rotateX: 0, rotateY: 0 }}
          animate={
            isOpen
              ? { rotateX: [0, -60, -45], rotateY: [-10, 45, 30], scale: [1, 0.95, 0.8] }
              : { rotateX: 0, rotateY: 0, scale: 1 }
          }
          transition={{ duration: 1.2, ease: 'easeInOut' }}
        >
          <div className={styles.crateTop} />
          <div className={styles.crateFront} />
          <div className={styles.crateLeft} />
          <div className={styles.crateRight} />
        </motion.div>
      </motion.div>

      {/* Explosive light rays */}
      <motion.div
        className={styles.lightRays}
        initial={{ opacity: 0, scale: 0.5 }}
        animate={isOpen ? { opacity: [0, 1, 0.6], scale: [0.5, 1.2, 1] } : { opacity: 0, scale: 0.5 }}
        transition={{ duration: 1.5, delay: 0.2 }}
      />

      {/* Shockwave pulse */}
      <motion.div
        className={styles.shockwave}
        initial={{ scale: 0.3, opacity: 1 }}
        animate={isOpen ? { scale: 2.5, opacity: 0 } : { scale: 0.3, opacity: 0 }}
        transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
      />

      {/* Reward reveal */}
      {isOpen && reward && (
        <>
          {/* Glow halo around reward */}
          <motion.div
            className={styles.rewardGlow}
            initial={{ opacity: 0, scale: 1.5 }}
            animate={{ opacity: [0, 0.8, 0], scale: [1.5, 1.2, 1] }}
            transition={{ duration: 1.2, delay: 0.7 }}
          />

          <motion.div
            className={styles.rewardContainer}
            initial={{ scale: 0, y: 50, opacity: 0 }}
            animate={{ scale: [0, 1.3, 1], y: [50, -20, 0], opacity: [0, 1, 1] }}
            transition={{ duration: 1, delay: 0.8, ease: 'backOut' }}
            onAnimationComplete={onComplete}
          >
            <motion.div
              className={styles.rewardIcon}
              animate={{
                rotateY: 360,
                y: [0, -15, 0],
                scale: [1, 1.1, 1]
              }}
              transition={{
                rotateY: { duration: 2, repeat: Infinity },
                y: { duration: 2, repeat: Infinity },
                scale: { duration: 2, repeat: Infinity }
              }}
            >
              {reward.icon}
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4, duration: 0.5 }}
              className={styles.rewardLabel}
            >
              <p className={styles.rewardName}>{reward.label}</p>
              {reward.amount && <span className={styles.amount}>+{reward.amount.toLocaleString()}</span>}
            </motion.div>

            {/* Sparkle effects around reward */}
            {Array.from({ length: 8 }).map((_, i) => (
              <motion.div
                key={`sparkle-${i}`}
                className={styles.sparkle}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((i / 8) * Math.PI * 2) * 80,
                  y: Math.sin((i / 8) * Math.PI * 2) * 80
                }}
                transition={{ duration: 1.5, delay: 1.2 }}
              />
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}
