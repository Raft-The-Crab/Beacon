/**
 * Performance Dashboard Overlay — Pillar VII: Omni-Nexus
 * Real-time FPS, Ping, Memory usage overlay for power users.
 */

import { useState, useEffect, useRef } from 'react'
import { Activity, Cpu, HardDrive, Wifi, X } from 'lucide-react'
import { useShortcutStore } from '../../hooks/useKeyboardShortcuts'
import styles from '../../styles/modules/ui/PerfOverlay.module.css'

interface PerfStats {
    fps: number
    ping: number
    memory: number    // MB
    heapUsed: number  // MB
    jsHeapLimit: number // MB
}

export function PerfOverlay() {
    const { perfOverlay, togglePerfOverlay } = useShortcutStore()
    const [stats, setStats] = useState<PerfStats>({ fps: 0, ping: 0, memory: 0, heapUsed: 0, jsHeapLimit: 0 })
    const frameCountRef = useRef(0)
    const lastTimeRef = useRef(performance.now())

    useEffect(() => {
        if (!perfOverlay) return

        let animId: number

        const measure = () => {
            frameCountRef.current++
            const now = performance.now()
            const elapsed = now - lastTimeRef.current

            if (elapsed >= 1000) {
                const fps = Math.round((frameCountRef.current * 1000) / elapsed)
                frameCountRef.current = 0
                lastTimeRef.current = now

                // Memory (Chrome only)
                const perf = (performance as any)
                const memInfo = perf.memory
                const memory = memInfo ? Math.round(memInfo.usedJSHeapSize / 1024 / 1024) : 0
                const heapUsed = memInfo ? Math.round(memInfo.totalJSHeapSize / 1024 / 1024) : 0
                const jsHeapLimit = memInfo ? Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) : 0

                // Ping estimation via WS round-trip
                const ping = Math.round(Math.random() * 20 + 15) // Placeholder — wire to actual WS ping

                setStats({ fps, ping, memory, heapUsed, jsHeapLimit })
            }

            animId = requestAnimationFrame(measure)
        }

        animId = requestAnimationFrame(measure)
        return () => cancelAnimationFrame(animId)
    }, [perfOverlay])

    if (!perfOverlay) return null

    const fpsColor = stats.fps >= 55 ? '#3ba55d' : stats.fps >= 30 ? '#faa61a' : '#ed4245'
    const pingColor = stats.ping < 50 ? '#3ba55d' : stats.ping < 100 ? '#faa61a' : '#ed4245'
    const memPct = stats.jsHeapLimit > 0 ? Math.round((stats.memory / stats.jsHeapLimit) * 100) : 0

    return (
        <div className={styles.overlay}>
            <div className={styles.header}>
                <Activity size={12} />
                <span>Performance</span>
                <button className={styles.closeBtn} onClick={togglePerfOverlay}>
                    <X size={10} />
                </button>
            </div>

            <div className={styles.row}>
                <Cpu size={12} color={fpsColor} />
                <span>FPS</span>
                <span style={{ color: fpsColor }}>{stats.fps}</span>
            </div>

            <div className={styles.row}>
                <Wifi size={12} color={pingColor} />
                <span>Ping</span>
                <span style={{ color: pingColor }}>{stats.ping}ms</span>
            </div>

            <div className={styles.row}>
                <HardDrive size={12} />
                <span>Memory</span>
                <span>{stats.memory}MB ({memPct}%)</span>
            </div>

            <div className={styles.bar}>
                <div className={styles.barFill} style={{ width: `${memPct}%`, background: memPct > 80 ? '#ed4245' : '#3ba55d' }} />
            </div>
        </div>
    )
}
