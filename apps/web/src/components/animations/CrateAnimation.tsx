import { useMemo, useState, useEffect, useRef } from 'react'
import { motion, useReducedMotion, AnimatePresence } from 'framer-motion'

interface CrateAnimationProps {
  isOpen: boolean
  onComplete?: () => void
  reward?: {
    icon: string | React.ReactNode
    label: string
    amount?: number
    rarity?: 'common' | 'rare' | 'epic' | 'legendary'
  }
}

type Phase = 'idle' | 'drop' | 'land' | 'shaking' | 'anticipate' | 'burst' | 'flash' | 'revealed'

const RARITY_COLORS: Record<string, string[]> = {
  common:    ['#aab8c2', '#cfd9df', '#ffffff'],
  rare:      ['#4a90d9', '#7289da', '#00b0f4', '#ffffff'],
  epic:      ['#9b59b6', '#c56cf0', '#e84393', '#ffffff'],
  legendary: ['#f0b232', '#ff9500', '#ff4500', '#fff176', '#ffffff'],
}

const SHAPES = ['square', 'circle', 'ribbon', 'star', 'triangle'] as const

function randomBetween(a: number, b: number) {
  return a + Math.random() * (b - a)
}

export function CrateAnimation({ isOpen, onComplete, reward }: CrateAnimationProps) {
  const prefersReducedMotion = useReducedMotion()
  const [phase, setPhase] = useState<Phase>('idle')
  const [showFlash, setShowFlash] = useState(false)
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const rarity = reward?.rarity ?? 'rare'
  const palette = RARITY_COLORS[rarity]

  useEffect(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []

    if (isOpen) {
      if (prefersReducedMotion) {
        setPhase('revealed')
        return
      }

      const q = (fn: () => void, ms: number) => {
        const t = setTimeout(fn, ms)
        timers.current.push(t)
      }

      setPhase('drop')
      q(() => setPhase('land'),       450)   // crate lands
      q(() => setPhase('shaking'),    620)   // starts shaking after micro-settle
      q(() => setPhase('anticipate'), 1900)  // final pull-back (squash)
      q(() => {
        setPhase('burst')
        setShowFlash(true)
        q(() => setShowFlash(false),  80)    // flash is very brief
      }, 2050)
      q(() => setPhase('revealed'),   2200)  // reward slides in
    } else {
      setPhase('idle')
    }

    return () => timers.current.forEach(clearTimeout)
  }, [isOpen, prefersReducedMotion])

  // ── Confetti particles ────────────────────────────────────────────────
  const particles = useMemo(() => {
    const count = prefersReducedMotion ? 0 : 120
    return Array.from({ length: count }, (_, i) => {
      const angle = randomBetween(0, Math.PI * 2)
      const speed = randomBetween(220, 520)
      const shape = SHAPES[Math.floor(Math.random() * SHAPES.length)]
      const color = palette[Math.floor(Math.random() * palette.length)]
      const size = shape === 'ribbon' ? randomBetween(4, 8) : randomBetween(6, 14)
      const duration = randomBetween(0.9, 2.0)
      return {
        id: i,
        vx: Math.cos(angle) * speed * randomBetween(0.4, 1),
        vy: Math.sin(angle) * speed * randomBetween(0.6, 1) - randomBetween(60, 180),
        gravity: randomBetween(400, 700),
        rotateZ: randomBetween(0, 720) * (Math.random() > 0.5 ? 1 : -1),
        scale: randomBetween(0.6, 1.6),
        delay: randomBetween(0, 0.12),
        duration,
        color,
        shape,
        size,
        width: shape === 'ribbon' ? size * randomBetween(3, 6) : size,
      }
    })
  }, [prefersReducedMotion, rarity])

  // ── Radial burst lines ────────────────────────────────────────────────
  const burstLines = useMemo(() => {
    const count = prefersReducedMotion ? 0 : 12
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * 360 + randomBetween(-5, 5),
      length: randomBetween(60, 160),
      delay: randomBetween(0, 0.05),
    }))
  }, [prefersReducedMotion])

  // ── Sparkle orbs ────────────────────────────────────────────────────
  const sparkles = useMemo(() => {
    const count = prefersReducedMotion ? 4 : 20
    return Array.from({ length: count }, (_, i) => ({
      id: i,
      angle: (i / count) * 360,
      radius: randomBetween(70, 160),
      size: randomBetween(4, 12),
      delay: randomBetween(0.1, 0.5),
      color: palette[i % palette.length],
    }))
  }, [prefersReducedMotion, rarity])

  const isBursting = phase === 'burst' || phase === 'flash'
  const isVisible = phase !== 'idle' && phase !== 'burst' && phase !== 'flash'
  const crateVisible = phase !== 'burst' && phase !== 'flash' && phase !== 'revealed'

  return (
    <div style={{
      position: 'fixed', inset: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      perspective: '800px',
      pointerEvents: isOpen ? 'all' : 'none',
      zIndex: 1000,
      overflow: 'hidden',
    }}>

      {/* ── Vignette backdrop ── */}
      <motion.div
        style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at center, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.85) 100%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: isOpen ? 1 : 0 }}
        transition={{ duration: 0.4 }}
      />

      {/* ── White flash ── */}
      {showFlash && (
        <div style={{
          position: 'absolute', inset: 0,
          background: 'white',
          zIndex: 100,
          pointerEvents: 'none',
        }} />
      )}

      {/* ── Screen Shake Container ── */}
      <motion.div
        style={{
          width: '100%', height: '100%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transformStyle: 'preserve-3d',
        }}
        animate={
          phase === 'shaking' ? {
            x: [0, -4, 4, -4, 4, 0],
            y: [0, 2, -2, 2, -2, 0],
          } : phase === 'burst' || phase === 'flash' ? {
            x: [0, -15, 15, -10, 10, -5, 5, 0],
            y: [0, 10, -10, 8, -8, 4, -4, 0],
          } : {}
        }
        transition={{
          duration: phase === 'shaking' ? 0.2 : 0.4,
          repeat: phase === 'shaking' ? Infinity : 0,
        }}
      >
        {/* ── Light rays (revealed only) ── */}
        <AnimatePresence>
          {phase === 'revealed' && (
            <motion.div
              key="rays"
              style={{
                position: 'absolute',
                width: 1200, height: 1200,
                background: `conic-gradient(from 0deg, transparent 0deg, ${palette[0]}44 10deg, transparent 20deg, transparent 30deg, ${palette[0]}33 40deg, transparent 50deg, transparent 60deg, ${palette[0]}44 70deg, transparent 80deg, transparent 90deg, ${palette[0]}33 100deg, transparent 110deg, transparent 120deg, ${palette[0]}44 130deg, transparent 140deg, transparent 150deg, ${palette[0]}33 160deg, transparent 170deg, transparent 180deg, ${palette[0]}44 190deg, transparent 200deg, transparent 210deg, ${palette[0]}33 220deg, transparent 230deg, transparent 240deg, ${palette[0]}44 250deg, transparent 260deg, transparent 270deg, ${palette[0]}33 280deg, transparent 290deg, transparent 300deg, ${palette[0]}44 310deg, transparent 320deg, transparent 330deg, ${palette[0]}33 340deg, transparent 350deg, transparent 360deg)`,
                borderRadius: '50%',
                filter: 'blur(40px)',
              }}
              initial={{ opacity: 0, scale: 0.1, rotate: 0 }}
              animate={{ opacity: [0, 1, 0.6], scale: [0.1, 1, 0.9], rotate: 360 }}
              exit={{ opacity: 0 }}
              transition={{ 
                opacity: { duration: 0.8 }, 
                scale: { duration: 0.8, type: 'spring', stiffness: 50 }, 
                rotate: { duration: 20, repeat: Infinity, ease: 'linear' } 
              }}
            />
          )}
        </AnimatePresence>

        {/* ── Crate ── */}
        <AnimatePresence>
          {crateVisible && (
            <motion.div
              key="crate"
              style={{
                position: 'absolute',
                transformStyle: 'preserve-3d',
                width: 120, height: 120,
              }}
              initial={{ y: -800, rotateX: 25, rotateY: -35, scale: 0.6 }}
              animate={
                phase === 'drop' ? {
                  y: -800, rotateX: 25, rotateY: -35, scale: 0.6,
                } : phase === 'land' ? {
                  y: 0, rotateX: 0, rotateY: 0, scale: [0.6, 1.15, 0.9, 1.0],
                  x: 0,
                } : phase === 'shaking' ? {
                  y: [0, -35, 25, -20, 18, -12, 10, -6, 4, -2, 0],
                  x: [0, -25, 30, -22, 25, -16, 14, -10, 8, -4, 0],
                  rotateZ: [0, -10, 12, -15, 18, -12, 10, -8, 6, -3, 0],
                  rotateY: [0, -30, 30, -35, 40, -30, 25, -20, 15, -8, 0],
                  scale: [1, 1.05, 1.08, 1.12, 1.15, 1.2, 1.25, 1.3, 1.35, 1.42, 1.5],
                  filter: ['brightness(1)', 'brightness(1.5)', 'brightness(1)', 'brightness(1.8)', 'brightness(1.2)', 'brightness(1.6)'],
                } : phase === 'anticipate' ? {
                  scale: 1.6,
                  y: 12,
                  rotateX: 10,
                  filter: 'brightness(3) blur(2px)',
                } : {}
              }
              exit={{ scale: 0, opacity: 0, filter: 'brightness(10) blur(20px)' }}
              transition={{
                duration: phase === 'drop' ? 0 : phase === 'land' ? 0.45 : phase === 'shaking' ? 1.3 : 0.15,
                ease: phase === 'land' ? [0.22, 1, 0.36, 1] : phase === 'anticipate' ? 'easeIn' : 'linear',
                ...(phase === 'drop' && { y: { type: 'spring', stiffness: 220, damping: 15 } }),
              }}
            >
              <CrateModel phase={phase} />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* ── Ground impact dust rings ── */}
      <AnimatePresence>
        {phase === 'land' && (
          <>
            {[0, 1].map(i => (
              <motion.div
                key={`dust-${i}`}
                style={{
                  position: 'absolute',
                  bottom: '42%',
                  width: 10, height: 10,
                  borderRadius: '50%',
                  border: `2px solid rgba(255,255,255,${0.6 - i * 0.2})`,
                  transformOrigin: 'center',
                }}
                initial={{ scale: 0.2, opacity: 0.8 }}
                animate={{ scale: 3 + i * 1.5, opacity: 0 }}
                transition={{ duration: 0.4 + i * 0.15, ease: 'easeOut', delay: i * 0.05 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ── Burst shockwave rings ── */}
      <AnimatePresence>
        {isBursting && (
          <>
            {[0, 1, 2].map(i => (
              <motion.div
                key={`shock-${i}`}
                style={{
                  position: 'absolute',
                  width: 10, height: 10,
                  borderRadius: '50%',
                  border: `${4 - i}px solid ${palette[0]}`,
                  boxShadow: `0 0 20px ${palette[0]}`,
                }}
                initial={{ scale: 0.5, opacity: 1 }}
                animate={{ scale: 8 + i * 3, opacity: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut', delay: i * 0.06 }}
              />
            ))}
          </>
        )}
      </AnimatePresence>

      {/* ── Burst lines ── */}
      <AnimatePresence>
        {isBursting && burstLines.map(line => (
          <motion.div
            key={`line-${line.id}`}
            style={{
              position: 'absolute',
              width: 3,
              height: line.length,
              background: `linear-gradient(to bottom, ${palette[0]}, transparent)`,
              borderRadius: 2,
              transformOrigin: 'center bottom',
              rotate: line.angle,
              originX: '50%',
              originY: '100%',
            }}
            initial={{ scaleY: 0, opacity: 1, y: 0 }}
            animate={{ scaleY: 1, opacity: 0, y: -line.length * 0.5 }}
            transition={{ duration: 0.35, ease: 'easeOut', delay: line.delay }}
          />
        ))}
      </AnimatePresence>

      {/* ── Confetti particles ── */}
      <AnimatePresence>
        {phase === 'revealed' && particles.map(p => (
          <motion.div
            key={`p-${p.id}`}
            style={{
              position: 'absolute',
              width: p.width,
              height: p.size,
              background: p.color,
              borderRadius: p.shape === 'circle' ? '50%' : p.shape === 'ribbon' ? 2 : p.shape === 'star' ? 0 : p.shape === 'triangle' ? 0 : 2,
              clipPath: p.shape === 'star'
                ? 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)'
                : p.shape === 'triangle'
                ? 'polygon(50% 0%, 0% 100%, 100% 100%)'
                : undefined,
              boxShadow: `0 0 6px ${p.color}88`,
              transformOrigin: 'center',
            }}
            initial={{ x: 0, y: 0, opacity: 1, scale: 0, rotateZ: 0 }}
            animate={{
              x: [0, p.vx * 0.6, p.vx],
              y: [0, p.vy * 0.4, p.vy + p.gravity],
              opacity: [1, 1, 1, 0],
              scale: [0, p.scale, p.scale * 0.8],
              rotateZ: p.rotateZ,
            }}
            transition={{ duration: p.duration, ease: [0.2, 0, 0.8, 1], delay: p.delay, times: [0, 0.3, 1] }}
          />
        ))}
      </AnimatePresence>

      {/* ── Reward ── */}
      <AnimatePresence>
        {phase === 'revealed' && reward && (
          <motion.div
            key="reward"
            style={{
              position: 'absolute',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 16,
              zIndex: 10,
            }}
            initial={{ scale: 0, y: 60, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 18, delay: 0.05 }}
            onAnimationComplete={onComplete}
          >
            {/* glow halo */}
            <motion.div
              style={{
                position: 'absolute',
                width: 200, height: 200,
                borderRadius: '50%',
                background: `radial-gradient(circle, ${palette[0]}55 0%, transparent 70%)`,
                filter: 'blur(20px)',
              }}
              animate={{ scale: [1, 1.3, 1], opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
            />

            {/* icon */}
            <motion.div
              style={{
                position: 'relative',
                width: 120, height: 120,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                borderRadius: '24px',
                background: `linear-gradient(135deg, ${palette[0]}33, ${palette[1] ?? palette[0]}55)`,
                border: `2px solid ${palette[0]}88`,
                boxShadow: `0 0 30px ${palette[0]}66, inset 0 1px 0 rgba(255,255,255,0.2)`,
                fontSize: 64,
              }}
              animate={{
                y: [0, -12, 0],
                rotateY: [0, 8, -8, 0],
                boxShadow: [
                  `0 0 20px ${palette[0]}44`,
                  `0 0 50px ${palette[0]}99`,
                  `0 0 20px ${palette[0]}44`,
                ],
              }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            >
              {typeof reward.icon === 'string' ? (
                <img src={reward.icon} alt={reward.label} style={{ width: '100%', height: '100%', objectFit: 'contain', borderRadius: 20 }} />
              ) : (
                reward.icon
              )}
            </motion.div>

            {/* sparkle orbs around icon */}
            {sparkles.map(s => (
              <motion.div
                key={`sp-${s.id}`}
                style={{
                  position: 'absolute',
                  width: s.size, height: s.size,
                  borderRadius: '50%',
                  background: s.color,
                  boxShadow: `0 0 ${s.size * 2}px ${s.color}`,
                }}
                initial={{ opacity: 0, scale: 0, x: 0, y: 0 }}
                animate={{
                  opacity: [0, 1, 0],
                  scale: [0, 1, 0],
                  x: Math.cos((s.angle * Math.PI) / 180) * s.radius,
                  y: Math.sin((s.angle * Math.PI) / 180) * s.radius,
                }}
                transition={{ duration: 1.2, delay: s.delay, repeat: Infinity, repeatDelay: randomBetween(0.5, 2.5) }}
              />
            ))}

            {/* label */}
            <motion.div
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
                position: 'relative',
              }}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.25, duration: 0.5, ease: 'easeOut' }}
            >
              {rarity !== 'common' && (
                <motion.span
                  style={{
                    fontSize: 10,
                    fontWeight: 800,
                    letterSpacing: '0.18em',
                    textTransform: 'uppercase',
                    color: palette[0],
                    textShadow: `0 0 12px ${palette[0]}`,
                    fontFamily: 'system-ui, sans-serif',
                  }}
                  animate={{ opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  {rarity}
                </motion.span>
              )}
              <motion.h2
                style={{
                  margin: 0,
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: 'system-ui, sans-serif',
                  color: '#fff',
                  letterSpacing: '-0.02em',
                  textShadow: `0 2px 20px rgba(0,0,0,0.5), 0 0 30px ${palette[0]}88`,
                }}
                animate={{
                  textShadow: [
                    `0 2px 20px rgba(0,0,0,0.5), 0 0 20px ${palette[0]}44`,
                    `0 2px 20px rgba(0,0,0,0.5), 0 0 40px ${palette[0]}cc`,
                    `0 2px 20px rgba(0,0,0,0.5), 0 0 20px ${palette[0]}44`,
                  ],
                }}
                transition={{ duration: 2, repeat: Infinity }}
              >
                {reward.label}
              </motion.h2>
              {reward.amount != null && (
                <motion.span
                  style={{
                    fontSize: 20,
                    fontWeight: 700,
                    fontFamily: 'system-ui, sans-serif',
                    color: palette[0],
                    textShadow: `0 0 16px ${palette[0]}`,
                  }}
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.45, type: 'spring', stiffness: 300 }}
                >
                  +{reward.amount.toLocaleString()}
                </motion.span>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────────────────────
// Crate 3-D model (CSS perspective faces)
// ─────────────────────────────────────────────────────────────────────────────
function CrateModel({ phase }: { phase: Phase }) {
  const SIZE = 120
  const crateGlow = phase === 'anticipate' ? '0 0 60px #f0b23288, 0 0 120px #f0b23244' : phase === 'shaking' ? '0 0 30px #f0b23255' : 'none'

  const face: React.CSSProperties = {
    position: 'absolute',
    width: SIZE,
    height: SIZE,
    boxSizing: 'border-box',
  }

  // Wood plank texture via repeating gradient
  const woodPattern = (lightness: number) => ({
    background: `
      repeating-linear-gradient(
        0deg,
        hsla(32, 65%, ${lightness}%, 1) 0px,
        hsla(32, 65%, ${lightness}%, 1) 18px,
        hsla(32, 50%, ${lightness - 8}%, 1) 18px,
        hsla(32, 50%, ${lightness - 8}%, 1) 20px
      )
    `,
  })

  // Metal band overlay
  const bandStyle = (dir: 'h' | 'v'): React.CSSProperties => ({
    position: 'absolute',
    ...(dir === 'h'
      ? { left: 0, right: 0, height: 14, background: 'linear-gradient(to bottom, #8a6f3a, #5a4a28)', borderTop: '1px solid #c8a84b', borderBottom: '1px solid #3a2e14' }
      : { top: 0, bottom: 0, width: 14, background: 'linear-gradient(to right, #8a6f3a, #5a4a28)', borderLeft: '1px solid #c8a84b', borderRight: '1px solid #3a2e14' }),
  })

  return (
    <div style={{
      position: 'relative',
      width: SIZE, height: SIZE,
      transformStyle: 'preserve-3d',
      transform: 'rotateX(-15deg) rotateY(25deg)',
      filter: crateGlow ? `drop-shadow(${crateGlow})` : undefined,
    }}>
      {/* Front */}
      <div style={{ ...face, ...woodPattern(48), transform: `translateZ(${SIZE / 2}px)`, border: '1px solid #3a2e14' }}>
        <div style={{ ...bandStyle('h'), top: 18 }} />
        <div style={{ ...bandStyle('h'), bottom: 18 }} />
        <div style={{ ...bandStyle('v'), left: 18 }} />
        <div style={{ ...bandStyle('v'), right: 18 }} />
        {/* corner bolts */}
        {[[16,16],[SIZE-16,16],[16,SIZE-16],[SIZE-16,SIZE-16]].map(([x,y],i) => (
          <div key={i} style={{ position:'absolute', left: x-5, top: y-5, width:10, height:10, borderRadius:'50%', background:'radial-gradient(circle at 35% 35%, #e8c870, #7a5c1a)', border:'1px solid #3a2a08', boxShadow:'0 1px 3px rgba(0,0,0,0.5)' }} />
        ))}
      </div>

      {/* Back */}
      <div style={{ ...face, ...woodPattern(30), transform: `rotateY(180deg) translateZ(${SIZE / 2}px)`, border: '1px solid #2a1e0a' }} />

      {/* Left */}
      <div style={{ ...face, ...woodPattern(36), transform: `rotateY(-90deg) translateZ(${SIZE / 2}px)`, border: '1px solid #2a1e0a' }}>
        <div style={{ ...bandStyle('h'), top: 18 }} />
        <div style={{ ...bandStyle('h'), bottom: 18 }} />
      </div>

      {/* Right */}
      <div style={{ ...face, ...woodPattern(40), transform: `rotateY(90deg) translateZ(${SIZE / 2}px)`, border: '1px solid #3a2e14' }}>
        <div style={{ ...bandStyle('h'), top: 18 }} />
        <div style={{ ...bandStyle('h'), bottom: 18 }} />
      </div>

      {/* Top */}
      <div style={{ ...face, ...woodPattern(55), transform: `rotateX(90deg) translateZ(${SIZE / 2}px)`, border: '1px solid #6a5030',
        background: `repeating-linear-gradient(90deg, hsla(32,65%,55%,1) 0px, hsla(32,65%,55%,1) 18px, hsla(32,50%,45%,1) 18px, hsla(32,50%,45%,1) 20px)`,
      }}>
        <div style={{ ...bandStyle('v'), left: 18 }} />
        <div style={{ ...bandStyle('v'), right: 18 }} />
      </div>

      {/* Bottom */}
      <div style={{ ...face, ...woodPattern(25), transform: `rotateX(-90deg) translateZ(${SIZE / 2}px)`, border: '1px solid #1a0e04' }} />
    </div>
  )
}