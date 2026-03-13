import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
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
  const [particles, setParticles] = useState<Particle[]>([])

  useEffect(() => {
    const colors = [
      '#5865f2', '#7b2ff7', '#949cf7', '#f0b232', '#23a55a',
      '#ff73fa', '#eb459e', '#00b0f4', '#ffffff', '#ffd700',
    ]
    const shapes: Particle['shape'][] = ['square', 'circle', 'star', 'ribbon']
    setParticles(
      Array.from({ length: 80 }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        delay: Math.random() * 0.8,
        duration: 2.2 + Math.random() * 1.6,
        color: colors[Math.floor(Math.random() * colors.length)],
        shape: shapes[Math.floor(Math.random() * shapes.length)],
        size: 6 + Math.random() * 8,
        xDrift: (Math.random() - 0.5) * 320,
        rotation: Math.random() * 900,
      }))
    )
  }, [])

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
        animate={{ opacity: [0, 0.85, 0], scale: [0.4, 1.8, 2.4] }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className={styles.glowBurst}
      />

      {/* Inner ring expand */}
      <motion.div
        initial={{ opacity: 1, scale: 0, borderWidth: 4 }}
        animate={{ opacity: 0, scale: 3.5, borderWidth: 1 }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={styles.burstRing}
      />

      {/* Second ring, delayed */}
      <motion.div
        initial={{ opacity: 1, scale: 0, borderWidth: 3 }}
        animate={{ opacity: 0, scale: 2.8, borderWidth: 1 }}
        transition={{ duration: 0.9, delay: 0.15, ease: 'easeOut' }}
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
            y: 650 + Math.random() * 200,
            opacity: [1, 1, 0],
            rotate: p.rotation,
            scale: [0.8, 1.1, 0.7],
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
            scale: [0, 1.4, 0],
            x: Math.cos((i / 5) * Math.PI * 2) * 70,
            y: Math.sin((i / 5) * Math.PI * 2) * 70,
          }}
          transition={{ duration: 0.9, delay: i * 0.07, ease: 'easeOut' }}
        >
          {['✨', '⭐', '💫', '🌟', '✦'][i]}
        </motion.div>
      ))}
    </motion.div>
  )
}
