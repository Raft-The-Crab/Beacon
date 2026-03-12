import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import styles from '../../styles/modules/animations/CelebrationAnimation.module.css'

interface Confetti {
  id: number
  left: number
  delay: number
  duration: number
  color: string
}

export function CelebrationAnimation() {
  const [confetti, setConfetti] = useState<Confetti[]>([])

  useEffect(() => {
    // Generate confetti particles
    const particles = Array.from({ length: 50 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.5,
      duration: 2 + Math.random() * 1,
      color: ['#5865f2', '#7289da', '#949cf7', '#f0b232', '#23a55a'][Math.floor(Math.random() * 5)],
    }))
    setConfetti(particles)
  }, [])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className={styles.container}
    >
      {/* Bright flash background */}
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className={styles.flash}
      />

      {/* Burst effect */}
      <motion.div
        initial={{ opacity: 1, scale: 0 }}
        animate={{ opacity: 0, scale: 4 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className={styles.burstRing}
      />

      {/* Confetti particles */}
      {confetti.map((p) => (
        <motion.div
          key={p.id}
          className={styles.confetti}
          initial={{
            x: 0,
            y: 0,
            opacity: 1,
            rotate: 0,
          }}
          animate={{
            x: (Math.random() - 0.5) * 400,
            y: Math.random() * 600 + 200,
            opacity: 0,
            rotate: Math.random() * 720,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
          style={{
            left: `${p.left}%`,
            backgroundColor: p.color,
            position: 'absolute',
            top: 0,
          }}
        />
      ))}

      {/* Center sparkles */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`sparkle-${i}`}
          className={styles.sparkle}
          initial={{ opacity: 1, scale: 0 }}
          animate={{ opacity: 0, scale: 1 }}
          transition={{
            duration: 0.6,
            delay: i * 0.1,
            ease: 'easeOut',
          }}
        >
          ✨
        </motion.div>
      ))}
    </motion.div>
  )
}
