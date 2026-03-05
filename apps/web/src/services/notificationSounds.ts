/**
 * Beacon Notification Sound Engine — Pillar VII: Omni-Nexus
 * Spatial audio notification system with customizable sound packs and volume control.
 */

type SoundName =
    | 'message_received'
    | 'message_sent'
    | 'mention'
    | 'dm_received'
    | 'user_join'
    | 'user_leave'
    | 'call_ring'
    | 'call_end'
    | 'notification'
    | 'quest_complete'
    | 'level_up'
    | 'error'
    | 'deafen'
    | 'undeafen'
    | 'mute'
    | 'unmute'

// interface SoundConfig {
//     src: string
//     volume: number
//     rate?: number
// }

// Frequencies for procedurally generated sounds (no external files needed)
const TONE_MAP: Record<SoundName, { freq: number; duration: number; type: OscillatorType; gain: number }> = {
    message_received: { freq: 880, duration: 0.08, type: 'sine', gain: 0.3 },
    message_sent: { freq: 660, duration: 0.06, type: 'sine', gain: 0.15 },
    mention: { freq: 1200, duration: 0.15, type: 'triangle', gain: 0.5 },
    dm_received: { freq: 1000, duration: 0.12, type: 'sine', gain: 0.4 },
    user_join: { freq: 523, duration: 0.1, type: 'sine', gain: 0.25 },
    user_leave: { freq: 330, duration: 0.15, type: 'sine', gain: 0.2 },
    call_ring: { freq: 740, duration: 0.3, type: 'triangle', gain: 0.5 },
    call_end: { freq: 220, duration: 0.2, type: 'sine', gain: 0.3 },
    notification: { freq: 900, duration: 0.1, type: 'triangle', gain: 0.35 },
    quest_complete: { freq: 1100, duration: 0.2, type: 'triangle', gain: 0.4 },
    level_up: { freq: 1320, duration: 0.25, type: 'sine', gain: 0.45 },
    error: { freq: 200, duration: 0.2, type: 'sawtooth', gain: 0.3 },
    deafen: { freq: 300, duration: 0.1, type: 'sine', gain: 0.2 },
    undeafen: { freq: 500, duration: 0.1, type: 'sine', gain: 0.2 },
    mute: { freq: 400, duration: 0.08, type: 'sine', gain: 0.15 },
    unmute: { freq: 600, duration: 0.08, type: 'sine', gain: 0.15 },
}

class NotificationSoundEngine {
    private ctx: AudioContext | null = null
    private masterVolume: number = 0.7
    private muted: boolean = false
    private cooldowns: Map<string, number> = new Map()

    private getContext(): AudioContext {
        if (!this.ctx) {
            this.ctx = new (window.AudioContext || (window as any).webkitAudioContext)()
        }
        if (this.ctx.state === 'suspended') {
            this.ctx.resume()
        }
        return this.ctx
    }

    /**
     * Play a procedurally generated notification tone.
     * Uses Web Audio API oscillators — no external sound files required.
     */
    play(name: SoundName, options?: { volume?: number }) {
        if (this.muted) return

        // Cooldown check (prevent spam)
        const now = Date.now()
        const lastPlayed = this.cooldowns.get(name) || 0
        if (now - lastPlayed < 100) return
        this.cooldowns.set(name, now)

        const tone = TONE_MAP[name]
        if (!tone) return

        const ctx = this.getContext()
        const oscillator = ctx.createOscillator()
        const gainNode = ctx.createGain()

        oscillator.type = tone.type
        oscillator.frequency.setValueAtTime(tone.freq, ctx.currentTime)

        const vol = tone.gain * this.masterVolume * (options?.volume ?? 1)
        gainNode.gain.setValueAtTime(vol, ctx.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tone.duration)

        oscillator.connect(gainNode)
        gainNode.connect(ctx.destination)

        oscillator.start(ctx.currentTime)
        oscillator.stop(ctx.currentTime + tone.duration + 0.05)

        // For multi-tone sounds (call ring, level up), add harmonics
        if (name === 'call_ring' || name === 'level_up' || name === 'quest_complete') {
            const harmonic = ctx.createOscillator()
            const hGain = ctx.createGain()
            harmonic.type = 'sine'
            harmonic.frequency.setValueAtTime(tone.freq * 1.5, ctx.currentTime)
            hGain.gain.setValueAtTime(vol * 0.3, ctx.currentTime)
            hGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + tone.duration)
            harmonic.connect(hGain)
            hGain.connect(ctx.destination)
            harmonic.start(ctx.currentTime + 0.05)
            harmonic.stop(ctx.currentTime + tone.duration + 0.1)
        }
    }

    setVolume(volume: number) {
        this.masterVolume = Math.max(0, Math.min(1, volume))
    }

    setMuted(muted: boolean) {
        this.muted = muted
    }

    getVolume(): number {
        return this.masterVolume
    }

    isMuted(): boolean {
        return this.muted
    }
}

export const notificationSounds = new NotificationSoundEngine()
