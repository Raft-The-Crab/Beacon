/**
 * Beacon Auto-Tuning System
 * 
 * Detects available memory at startup and dynamically adjusts:
 * - V8 heap limit
 * - RSS backpressure thresholds
 * - AI queue concurrency
 * - Prolog bypass threshold
 * - GC trigger threshold
 * 
 * Works on Railway, ClawCloud, or local dev.
 */

interface TuningProfile {
    name: string
    heapLimitMB: number
    rssBackpressureMB: number
    prologBypassMB: number
    gcTriggerMB: number
    aiConcurrency: number
    jsonLimitMB: string
    keepAliveIntervalMs: number
}

// Detect total system memory (or container memory limit via cgroup)
function detectAvailableMemoryMB(): number {
    const os = require('os')

    // Try cgroup v2 first (most container platforms)
    try {
        const fs = require('fs')
        const cgroupLimit = fs.readFileSync('/sys/fs/cgroup/memory.max', 'utf8').trim()
        if (cgroupLimit !== 'max') {
            const limitMB = Math.round(parseInt(cgroupLimit) / 1024 / 1024)
            if (limitMB > 0 && limitMB < 16384) return limitMB // sanity check
        }
    } catch { }

    // Try cgroup v1
    try {
        const fs = require('fs')
        const cgroupLimit = fs.readFileSync('/sys/fs/cgroup/memory/memory.limit_in_bytes', 'utf8').trim()
        const limitMB = Math.round(parseInt(cgroupLimit) / 1024 / 1024)
        if (limitMB > 0 && limitMB < 16384) return limitMB
    } catch { }

    // Fallback: use total system memory
    return Math.round(os.totalmem() / 1024 / 1024)
}

// Generate an optimized profile based on detected memory
function generateProfile(availableMB: number, serviceName: string): TuningProfile {
    // Reserve ~20% for OS/Node overhead, use 80% for app
    const usableMB = Math.floor(availableMB * 0.80)

    if (serviceName === 'clawcloud-api') {
        return {
            name: `clawcloud-api (${availableMB} MB detected)`,
            heapLimitMB: Math.max(usableMB - 100, 256),
            rssBackpressureMB: Math.round(availableMB * 0.85),
            prologBypassMB: Math.round(availableMB * 0.70),
            gcTriggerMB: Math.round(availableMB * 0.80),
            aiConcurrency: 2,
            jsonLimitMB: '15mb',
            keepAliveIntervalMs: 5 * 60 * 1000,
        }
    }

    if (usableMB >= 400) {
        // Comfortable — Railway (512 MB) or better
        return {
            name: `generous (${availableMB} MB detected)`,
            heapLimitMB: Math.min(usableMB - 50, 430),   // leave 50 MB for native
            rssBackpressureMB: Math.round(availableMB * 0.85),
            prologBypassMB: Math.round(availableMB * 0.75),
            gcTriggerMB: Math.round(availableMB * 0.80),
            aiConcurrency: 2,
            jsonLimitMB: '25mb',
            keepAliveIntervalMs: 5 * 60 * 1000,
        }
    } else if (usableMB >= 180) {
        // Tight — small container sandbox (~256 MB) or similar
        return {
            name: `tight (${availableMB} MB detected)`,
            heapLimitMB: Math.min(usableMB - 40, 192),
            rssBackpressureMB: Math.round(availableMB * 0.80),
            prologBypassMB: Math.round(availableMB * 0.70),
            gcTriggerMB: Math.round(availableMB * 0.75),
            aiConcurrency: 1,
            jsonLimitMB: '10mb',
            keepAliveIntervalMs: 5 * 60 * 1000,
        }
    } else {
        // Minimal — very constrained (< 180 MB usable)
        return {
            name: `minimal (${availableMB} MB detected)`,
            heapLimitMB: Math.max(usableMB - 30, 64),
            rssBackpressureMB: Math.round(availableMB * 0.75),
            prologBypassMB: 0, // always skip Prolog in minimal mode
            gcTriggerMB: Math.round(availableMB * 0.70),
            aiConcurrency: 1,
            jsonLimitMB: '5mb',
            keepAliveIntervalMs: 5 * 60 * 1000,
        }
    }
}

// Singleton — detect once, reuse everywhere
let _profile: TuningProfile | null = null

export function getProfile(serviceName: string = 'beacon'): TuningProfile {
    if (_profile) return _profile

    const availableMB = detectAvailableMemoryMB()
    _profile = generateProfile(availableMB, serviceName)

    console.log(`\n┌─────────────────────────────────────────┐`)
    console.log(`│  🔧 Auto-Tune: ${_profile.name.padEnd(24)}│`)
    console.log(`├─────────────────────────────────────────┤`)
    console.log(`│  Heap limit:      ${String(_profile.heapLimitMB).padStart(4)} MB              │`)
    console.log(`│  RSS backpressure:${String(_profile.rssBackpressureMB).padStart(4)} MB              │`)
    console.log(`│  Prolog bypass:   ${String(_profile.prologBypassMB).padStart(4)} MB              │`)
    console.log(`│  GC trigger:      ${String(_profile.gcTriggerMB).padStart(4)} MB              │`)
    console.log(`│  AI concurrency:  ${String(_profile.aiConcurrency).padStart(4)}                 │`)
    console.log(`│  JSON limit:      ${_profile.jsonLimitMB.padStart(5)}                │`)
    console.log(`└─────────────────────────────────────────┘\n`)

    return _profile
}

export function detectAvailableMemory(): number {
    return detectAvailableMemoryMB()
}

export type { TuningProfile }
