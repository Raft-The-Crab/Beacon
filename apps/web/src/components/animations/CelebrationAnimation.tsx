import { useMemo, useEffect, useRef } from 'react'
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion'

interface CelebrationAnimationProps {
  label?: string
  sublabel?: string
}

interface Coin {
  id: number
  vx: number
  vy: number
  gravity: number
  duration: number
  delay: number
  rotX: number
  rotY: number
  rotZ: number
  scale: number
  colorIdx: number
}

const COIN_COLORS = [
  { bg: '#f0b232', border: 'rgba(255,220,100,0.5)', shadow: '#f0b232', text: 'rgba(100,60,0,0.85)' },
  { bg: '#ffcc55', border: 'rgba(255,230,120,0.5)', shadow: '#ffcc55', text: 'rgba(120,70,0,0.85)' },
  { bg: '#ffd166', border: 'rgba(255,235,140,0.5)', shadow: '#ffd166', text: 'rgba(140,80,0,0.85)' },
  { bg: '#fff8e0', border: 'rgba(255,255,200,0.6)', shadow: '#ffffff',  text: 'rgba(160,100,10,0.85)' },
  { bg: '#ff9f1c', border: 'rgba(255,200,80,0.4)',  shadow: '#ff9f1c', text: 'rgba(90,40,0,0.85)' },
]

function rnd(a: number, b: number) { return a + Math.random() * (b - a) }

export function CelebrationAnimation({ label = 'BEACON+', sublabel = 'ACTIVATED' }: CelebrationAnimationProps) {
  const prefersReducedMotion = useReducedMotion()

  const coins = useMemo<Coin[]>(() => {
      const count = prefersReducedMotion ? 10 : 120
      return Array.from({ length: count }, (_, i) => {
        const angle = Math.random() * Math.PI * 2
        const speed = rnd(250, 600)
      return {
        id: i,
        vx: Math.cos(angle) * speed * rnd(0.5, 1),
        vy: -(rnd(160, 420)),
        gravity: rnd(380, 700),
        duration: rnd(1.0, 2.3),
        delay: rnd(0, 0.18),
        rotX: rnd(360, 1440) * (Math.random() > 0.5 ? 1 : -1),
        rotY: rnd(360, 1440) * (Math.random() > 0.5 ? 1 : -1),
        rotZ: rnd(180, 720)  * (Math.random() > 0.5 ? 1 : -1),
        scale: rnd(0.7, 1.6),
        colorIdx: i % COIN_COLORS.length,
      }
    })
  }, [prefersReducedMotion])

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      style={{
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        perspective: '1200px',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      {/* ── Radial background bloom ── */}
      {!prefersReducedMotion && (
        <motion.div
          style={{
            position: 'absolute', width: 600, height: 600, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(240,178,50,0.22) 0%, rgba(240,100,0,0.1) 45%, transparent 72%)',
            filter: 'blur(10px)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: [0, 2.4, 0], opacity: [0, 0.9, 0] }}
          transition={{ duration: 0.9, ease: 'easeOut', delay: 0.05 }}
        />
      )}

      {/* ── Screen Shake Container ── */}
      <motion.div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transformStyle: 'preserve-3d',
        }}
        animate={{
          x: [0, -10, 10, -8, 8, -5, 5, 0],
          y: [0, 8, -8, 6, -6, 4, -4, 0],
        }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
      >
        {/* ── Central supernova core ── */}
        <motion.div
          style={{
            position: 'absolute', borderRadius: '50%',
            width: 24, height: 24, marginLeft: -12, marginTop: -12,
            background: 'radial-gradient(circle, #fff8e8 0%, #f0b232 45%, #ff5500 80%, transparent 100%)',
          }}
          initial={{ scale: 0, opacity: 0 }}
          animate={
            prefersReducedMotion
              ? { scale: [0, 1, 0], opacity: [0, 0.5, 0] }
              : { scale: [0, 16, 0], opacity: [0, 1, 0.6, 0] }
          }
          transition={{ duration: 0.65, ease: 'easeOut' }}
        />

        {/* ── Shockwave rings ── */}
        {!prefersReducedMotion && [0, 1, 2].map(i => (
          <motion.div
            key={`ring-${i}`}
            style={{
              position: 'absolute', borderRadius: '50%',
              width: 12, height: 12, marginLeft: -6, marginTop: -6,
              border: `${6 - i * 1.5}px solid`,
              borderColor: i === 0 ? '#f0b232' : i === 1 ? '#ff9f1c' : '#ffd16699',
              boxShadow: i === 0 ? '0 0 20px #f0b23244' : 'none',
            }}
            initial={{ scale: 0.3, opacity: 1 }}
            animate={{ scale: 20 + i * 5, opacity: 0 }}
            transition={{ duration: 0.65 + i * 0.12, delay: i * 0.07, ease: [0.2, 0.9, 0.4, 1] }}
          />
        ))}
      </motion.div>

      {/* ── Coins / confetti ── */}
      {coins.map(coin => {
        const col = COIN_COLORS[coin.colorIdx]
        // Keyframe positions: [0] start, [mid] apex/spread, [end] fallen
        const xKf = [0, coin.vx * 0.55, coin.vx]
        const yKf = [0, coin.vy, coin.vy + coin.gravity]
        return (
          <motion.div
            key={`coin-${coin.id}`}
            style={{
              position: 'absolute',
              left: 'calc(50% - 15px)', top: 'calc(50% - 15px)',
              width: 30, height: 30, borderRadius: '50%',
              background: col.bg,
              border: `3px solid ${col.border}`,
              boxShadow: `0 0 14px ${col.shadow}88, inset 0 0 8px rgba(0,0,0,0.18)`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: col.text, fontWeight: 900, fontSize: 16,
              transformStyle: 'preserve-3d',
            }}
            initial={{ x: 0, y: 0, opacity: 0, scale: 0, rotateX: 0, rotateY: 0, rotateZ: 0 }}
            animate={
              prefersReducedMotion
                ? { opacity: [0, 0.5, 0] }
                : {
                    x: xKf,
                    y: yKf,
                    opacity: [0, 1, 1, 1, 0],
                    scale: [0, coin.scale * 1.1, coin.scale, coin.scale * 0.85],
                    rotateX: [0, coin.rotX],
                    rotateY: [0, coin.rotY],
                    rotateZ: [0, coin.rotZ],
                  }
            }
            transition={{
              duration: coin.duration,
              delay: coin.delay,
              times: [0, 0.12, 0.5, 0.75, 1],
              x: { ease: 'linear', duration: coin.duration, delay: coin.delay },
              y: { ease: [0.2, 0, 0.8, 1], duration: coin.duration, delay: coin.delay },
              rotateX: { ease: 'linear' },
              rotateY: { ease: 'linear' },
              rotateZ: { ease: 'linear' },
            }}
          >
            +
          </motion.div>
        )
      })}

      {/* ── Title reveal ── */}
      <motion.div
        style={{
          position: 'absolute', top: '50%', width: '100%',
          textAlign: 'center', pointerEvents: 'none', zIndex: 20,
          marginTop: -60,
        }}
        initial={{ opacity: 0, scale: 2.8, filter: 'blur(28px)', y: -30 }}
        animate={{ opacity: 1, scale: 1, filter: 'blur(0px)', y: 0 }}
        transition={{ type: 'spring', damping: 14, stiffness: 130, delay: 0.18 }}
      >
        <motion.h1
          style={{
            margin: 0,
            fontSize: 'clamp(52px, 10vw, 80px)',
            fontWeight: 900,
            letterSpacing: '-0.02em',
            color: '#ffffff',
            lineHeight: 1,
            textShadow: '0 0 40px #f0b23288, 0 0 80px #f0b23233, 0 2px 20px rgba(0,0,0,0.6)',
          }}
          animate={{
            textShadow: [
              '0 0 30px #f0b23266, 0 0 60px #f0b23222, 0 2px 0 rgba(0,0,0,0.4)',
              '0 0 50px #f0b232bb, 0 0 100px #f0b23255, 0 2px 0 rgba(0,0,0,0.4)',
              '0 0 30px #f0b23266, 0 0 60px #f0b23222, 0 2px 0 rgba(0,0,0,0.4)',
            ],
          }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: 0.8 }}
        >
          {label}
        </motion.h1>

        <motion.p
          style={{
            margin: '10px 0 0',
            fontSize: 'clamp(13px, 2.5vw, 20px)',
            fontWeight: 700,
            letterSpacing: '0.28em',
            color: '#f0b232',
            textShadow: '0 0 18px #f0b232aa',
          }}
          initial={{ opacity: 0, letterSpacing: '0.08em' }}
          animate={{ opacity: 1, letterSpacing: '0.28em' }}
          transition={{ duration: 0.55, ease: 'easeOut', delay: 0.85 }}
        >
          {sublabel}
        </motion.p>
      </motion.div>
    </motion.div>
  )
}