import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styles from '../../styles/modules/animations/CelebrationAnimation.module.css'

interface Particle {
  id: number
  left: number
  delay: number
  duration: number
  color: string
  shape: 'square' | 'circle' | 'star' | 'ribbon'
  size: number
  xDrift: number
  rotation: number
}

export function CelebrationAnimation() {
  const prefersReducedMotion = useReducedMotion()

  const particles = useMemo<Particle[]>(() => {
    const colors = ['#4f83ff', '#79a8ff', '#f0b232', '#23a55a', '#ff875f', '#00b0f4', '#ffffff', '#ffd166']
    const shapes: Particle['shape'][] = ['square', 'circle', 'star', 'ribbon']
    return Array.from({ length: prefersReducedMotion ? 24 : 70 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      delay: Math.random() * 0.7,
      duration: 2 + Math.random() * 1.5,
      color: colors[Math.floor(Math.random() * colors.length)],
      shape: shapes[Math.floor(Math.random() * shapes.length)],
      size: 6 + Math.random() * 7,
      xDrift: (Math.random() - 0.5) * (prefersReducedMotion ? 160 : 320),
      rotation: Math.random() * 760,
    }))
  }, [prefersReducedMotion])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={styles.container}
    >
      {/* Radial glow burst */}
      <motion.div
        initial={{ opacity: 0, scale: 0.4 }}
        animate={
          prefersReducedMotion
            ? { opacity: [0, 0.45, 0], scale: [0.8, 1.15, 1.3] }
            : { opacity: [0, 0.85, 0], scale: [0.4, 1.8, 2.4] }
        }
        transition={{ duration: prefersReducedMotion ? 0.35 : 0.7, ease: 'easeOut' }}
        className={styles.glowBurst}
      />

      {/* Inner ring expand */}
      <motion.div
        initial={{ opacity: 1, scale: 0, borderWidth: 4 }}
        animate={{ opacity: 0, scale: prefersReducedMotion ? 1.7 : 3.5, borderWidth: 1 }}
        transition={{ duration: prefersReducedMotion ? 0.4 : 0.9, ease: 'easeOut' }}
        className={styles.burstRing}
      />

      {/* Second ring, delayed */}
      <motion.div
        initial={{ opacity: 1, scale: 0, borderWidth: 3 }}
        animate={{ opacity: 0, scale: prefersReducedMotion ? 1.5 : 2.8, borderWidth: 1 }}
        transition={{ duration: prefersReducedMotion ? 0.35 : 0.9, delay: prefersReducedMotion ? 0.05 : 0.15, ease: 'easeOut' }}
        className={styles.burstRingAlt}
      />

      {/* Confetti / particle shower */}
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className={`${styles.confetti} ${styles[p.shape]}`}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.8 }}
          animate={{
            x: p.xDrift,
            y: (prefersReducedMotion ? 420 : 640) + Math.random() * 170,
            opacity: [1, 1, 0],
            rotate: p.rotation,
            scale: prefersReducedMotion ? [0.8, 0.9, 0.8] : [0.8, 1.1, 0.7],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            ease: 'easeOut',
          }}
          style={{
            left: `${p.left}%`,
            backgroundColor: p.shape !== 'star' ? p.color : 'transparent',
            color: p.color,
            width: p.size,
            height: p.shape === 'ribbon' ? p.size * 3 : p.size,
            position: 'absolute',
            top: '45%',
          }}
        />
      ))}

      {/* Crown sparkle cluster */}
      {[0, 1, 2, 3, 4].map((i) => (
        <motion.div
          key={`sparkle-${i}`}
          className={styles.sparkle}
          initial={{ opacity: 1, scale: 0, x: 0, y: 0 }}
          animate={{
            opacity: [1, 1, 0],
            scale: prefersReducedMotion ? [0, 1.05, 0] : [0, 1.4, 0],
            x: Math.cos((i / 5) * Math.PI * 2) * (prefersReducedMotion ? 46 : 70),
            y: Math.sin((i / 5) * Math.PI * 2) * (prefersReducedMotion ? 46 : 70),
          }}
          transition={{ duration: prefersReducedMotion ? 0.45 : 0.9, delay: i * 0.06, ease: 'easeOut' }}
        >
          {['✨', '⭐', '💫', '🌟', '✦'][i]}
        </motion.div>
      ))}
    </motion.div>
  )
}
