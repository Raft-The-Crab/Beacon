import { useMemo } from 'react'
import { motion, useReducedMotion } from 'framer-motion'
import styles from '../../styles/modules/animations/CelebrationAnimation.module.css'

interface Token {
  id: number
  xFinal: number
  yApex: number
  yFinal: number
  delay: number
  duration: number
  rotationX: number
  rotationY: number
  rotationZ: number
  scale: number
  color: string
}

export function CelebrationAnimation() {
  const prefersReducedMotion = useReducedMotion()

  const tokens = useMemo<Token[]>(() => {
    return Array.from({ length: prefersReducedMotion ? 12 : 60 }, (_, i) => {
      const angle = (Math.random() * Math.PI) + Math.PI; // Top half explosion
      const distance = 200 + Math.random() * 600
      const apex = -200 - Math.random() * 400
      
      return {
        id: i,
        xFinal: Math.cos(angle) * distance,
        yApex: apex,
        yFinal: 800 + Math.random() * 400, // Fall out of screen
        delay: Math.random() * 0.3, // Initial burst
        duration: 2 + Math.random() * 1.5,
        rotationX: Math.random() * 1440,
        rotationY: Math.random() * 1440,
        rotationZ: Math.random() * 720,
        scale: 0.8 + Math.random() * 1.5,
        color: ['#f0b232', '#ffaa00', '#ffd166', '#ffffff'][Math.floor(Math.random() * 4)]
      }
    })
  }, [prefersReducedMotion])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className={styles.container}
      style={{ perspective: 1200 }}
    >
      {/* Central Supernova Burst */}
      <motion.div
        initial={{ opacity: 0, scale: 0 }}
        animate={
          prefersReducedMotion
            ? { opacity: [0, 0.45, 0], scale: [0.8, 1.15, 1.3] }
            : { opacity: [0, 1, 0.8, 0], scale: [0, 2.5, 4, 0] }
        }
        transition={{ duration: prefersReducedMotion ? 0.35 : 1.2, ease: 'easeOut' }}
        className={styles.glowBurst}
      />

      {/* Outer Shockwaves */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={`shockwave-${i}`}
          initial={{ opacity: 1, scale: 0, borderWidth: 10 - i * 2 }}
          animate={{ opacity: 0, scale: 4 + i * 2, borderWidth: 1 }}
          transition={{ duration: 0.8 + i * 0.2, delay: i * 0.1, ease: 'easeOut' }}
          className={styles.burstRing}
        />
      ))}

      {/* 3D Physical Tokens */}
      {tokens.map((t) => (
        <motion.div
          key={`token-${t.id}`}
          className={styles.confetti}
          initial={{ x: 0, y: 0, opacity: 1, rotateX: 0, rotateY: 0, rotateZ: 0, scale: 0 }}
          animate={
            prefersReducedMotion
              ? { opacity: 0 }
              : {
                  x: [0, t.xFinal * 0.8, t.xFinal], 
                  y: [0, t.yApex, t.yFinal], // Arced gravity fall
                  opacity: [0, 1, 1, 0],
                  scale: [0, t.scale, t.scale, t.scale * 0.8],
                  rotateX: t.rotationX,
                  rotateY: t.rotationY,
                  rotateZ: t.rotationZ,
                }
          }
          transition={{
            duration: t.duration,
            delay: t.delay,
            ease: "circIn", // Accelerates downward falling
            x: { ease: "linear", duration: t.duration, delay: t.delay }, // Horizontal drift is linear
            y: { ease: "circIn", duration: t.duration, delay: t.delay }, // Gravity effect
            rotateX: { duration: t.duration, ease: 'linear' },
            rotateY: { duration: t.duration, ease: 'linear' },
            rotateZ: { duration: t.duration, ease: 'linear' }
          }}
          style={{
            position: 'absolute',
            width: 32,
            height: 32,
            borderRadius: '50%',
            backgroundColor: t.color,
            border: '4px solid rgba(255,255,255,0.4)',
            boxShadow: `0 0 15px ${t.color}, inset 0 0 10px rgba(0,0,0,0.2)`,
            transformStyle: 'preserve-3d',
            left: 'calc(50% - 16px)',
            top: 'calc(50% - 16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(0,0,0,0.3)',
            fontWeight: 900,
            fontSize: 18,
          }}
        >
          {/* Beacon+ Plus sign on the coin */}
          +
        </motion.div>
      ))}

      {/* Epic Title Reveal */}
      <motion.div
        initial={{ scale: 3, filter: 'blur(30px)', opacity: 0, y: -200 }}
        animate={{ scale: 1, filter: 'blur(0px)', opacity: 1, y: -50 }}
        transition={{ type: 'spring', damping: 10, stiffness: 150, delay: 0.2 }}
        className={styles.rewardLabel}
        style={{ position: 'absolute', top: '50%', width: '100%', textAlign: 'center', pointerEvents: 'none', zIndex: 100 }}
      >
        <h1 style={{ fontSize: 64, color: 'white', textShadow: '0 0 30px #f0b232', margin: 0 }}>BEACON+</h1>
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1, duration: 1 }}
          style={{ fontSize: 24, color: '#f0b232', fontWeight: 'bold' }}
        >
          ACTIVATED
        </motion.p>
      </motion.div>
    </motion.div>
  )
}
