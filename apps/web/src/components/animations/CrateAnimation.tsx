import { useMemo, useState, useEffect } from 'react'
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
  const [phase, setPhase] = useState<'idle' | 'shaking' | 'bursting' | 'revealed'>('idle')

  useEffect(() => {
    if (isOpen) {
      setPhase('shaking')
      const shakeTimer = setTimeout(() => {
        setPhase('bursting')
        const burstTimer = setTimeout(() => {
          setPhase('revealed')
        }, 300)
        return () => clearTimeout(burstTimer)
      }, 1200) // 1.2s shake
      return () => clearTimeout(shakeTimer)
    } else {
      setPhase('idle')
    }
  }, [isOpen])

  const confettiParticles = useMemo(
    () =>
      Array.from({ length: prefersReducedMotion ? 0 : 50 }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 800,
        y: (Math.random() - 0.5) * 800,
        rotateX: Math.random() * 720,
        rotateY: Math.random() * 720,
        scale: 0.5 + Math.random() * 1.5,
        delay: Math.random() * 0.1,
        duration: 1 + Math.random() * 2,
        color: ['#f0b232', '#7289da', '#fff', '#2ecc71', '#e91e63'][Math.floor(Math.random() * 5)]
      })),
    [prefersReducedMotion]
  )

  const sparkleBursts = useMemo(
    () =>
      Array.from({ length: prefersReducedMotion ? 3 : 15 }, (_, i) => ({
        id: i,
        radius: prefersReducedMotion ? 52 : 80 + Math.random() * 60,
        delay: 0.2 + i * 0.05,
      })),
    [prefersReducedMotion]
  )

  return (
    <div className={styles.container}>
      <motion.div 
        className={styles.backdropVignette} 
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 0.95 : 0 }}
        transition={{ duration: 0.5 }}
      />

      {phase === 'revealed' && (
        <>
          {confettiParticles.map((particle) => (
            <motion.div
              key={`confetti-${particle.id}`}
              className={styles.confetti}
              style={{ background: particle.color }}
              initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotateX: 0, rotateY: 0 }}
              animate={
                prefersReducedMotion
                  ? { opacity: 0 }
                  : {
                      x: particle.x,
                      y: particle.y + 400,
                      opacity: [1, 1, 0],
                      scale: particle.scale,
                      rotateX: particle.rotateX,
                      rotateY: particle.rotateY,
                    }
              }
              transition={{ duration: particle.duration, ease: 'easeOut', delay: particle.delay }}
            />
          ))}
        </>
      )}

      {/* Crate Entity */}
      {phase !== 'revealed' && (
        <motion.div
          className={styles.crateWrapper}
          initial={{ y: -500, scale: 0, rotateX: 45, rotateY: 45 }}
          animate={
            phase === 'idle'
              ? { y: 0, scale: 1, rotateX: 0, rotateY: 0 }
              : phase === 'shaking'
              ? {
                  y: [0, -25, 25, -25, 30, -15, 15, -10, 10, -5, 5, 0],
                  x: [0, -20, 20, -30, 30, -20, 20, -10, 10, -5, 5, 0],
                  rotateX: [0, -15, 15, -25, 25, -15, 15, -10, 10, 0],
                  rotateY: [0, -20, 20, -30, 30, -20, 20, -10, 10, 0],
                  scale: [1, 1.05, 1.05, 1.1, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35],
                  filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)', 'brightness(2)', 'brightness(1)'],
                }
              : phase === 'bursting'
              ? { scale: 1.5, opacity: 0, filter: 'brightness(3)' }
              : {}
          }
          transition={{
            y: { type: 'spring', stiffness: 300, damping: 20 },
            default: { 
              duration: phase === 'shaking' ? 1.2 : phase === 'bursting' ? 0.2 : 0.5,
              ease: phase === 'bursting' ? 'easeIn' : 'linear'
            }
          }}
        >
          <motion.div className={styles.crate}>
            <div className={styles.crateTop} />
            <div className={styles.crateFront} />
            <div className={styles.crateLeft} />
            <div className={styles.crateRight} />
          </motion.div>
        </motion.div>
      )}

      {/* Burst Shockwave */}
      <motion.div
        className={styles.shockwave}
        initial={{ scale: 0, opacity: 0 }}
        animate={
          phase === 'bursting'
            ? { scale: [0.5, 3], opacity: [1, 0], borderWidth: ['20px', '0px'] }
            : { scale: 0, opacity: 0 }
        }
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />

      {/* Light Rays Background */}
      <motion.div
        className={styles.lightRays}
        initial={{ opacity: 0, scale: 0, rotate: 0 }}
        animate={
          phase === 'revealed' || phase === 'bursting'
            ? {
                opacity: [0, 1, 0.8],
                scale: [0.5, 2, 2],
                rotate: [0, 180, 360],
              }
            : { opacity: 0, scale: 0, rotate: 0 }
        }
        transition={{ opacity: { duration: 0.5 }, scale: { duration: 0.5, type: 'spring' }, rotate: { duration: 10, repeat: Infinity, ease: 'linear' } }}
      />

      {/* Reward Reveal */}
      {(phase === 'revealed' || phase === 'bursting') && reward && (
        <>
          <motion.div
            className={styles.rewardGlow}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: [0, 1, 0.6], scale: [0, 1.5, 1] }}
            transition={{ duration: 0.6 }}
          />

          <motion.div
            className={styles.rewardContainer}
            initial={{ scale: 0, y: 100, opacity: 0 }}
            animate={{ scale: [0, 1.2, 1], y: 0, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 200, damping: 15 }}
            onAnimationComplete={onComplete}
          >
            <motion.div
              className={styles.rewardIcon}
              animate={{
                y: [0, -15, 0],
                rotateY: [0, 20, -20, 0]
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: 'easeInOut'
              }}
            >
              {reward.icon}
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className={styles.rewardLabel}
            >
              <motion.h2 
                className={styles.rewardName}
                animate={{ textShadow: ['0 0 10px rgba(255,255,255,0)', '0 0 20px rgba(255,255,255,0.8)', '0 0 10px rgba(255,255,255,0)'] }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {reward.label}
              </motion.h2>
              {reward.amount && <span className={styles.amount}>+{reward.amount.toLocaleString()}</span>}
            </motion.div>

            {sparkleBursts.map((burst) => (
              <motion.div
                key={`sparkle-${burst.id}`}
                className={styles.sparkle}
                initial={{ opacity: 0, scale: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1.5, 0],
                  x: Math.cos((burst.id / sparkleBursts.length) * Math.PI * 2) * burst.radius,
                  y: Math.sin((burst.id / sparkleBursts.length) * Math.PI * 2) * burst.radius,
                }}
                transition={{ duration: 1, delay: burst.delay, repeat: Infinity, repeatDelay: Math.random() * 2 }}
              />
            ))}
          </motion.div>
        </>
      )}
    </div>
  )
}
