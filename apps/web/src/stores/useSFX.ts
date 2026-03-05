import { create } from 'zustand'
import { Howl } from 'howler'

interface SFXState {
    volume: number
    sounds: Record<string, Howl>
    setVolume: (v: number) => void
    playSFX: (name: string) => void
    init: () => void
}

const SFX_ASSETS = {
    mention: '/assets/sounds/mention.mp3', // Placeholder until real assets are added
    message_sent: '/assets/sounds/sent.mp3',
    join: '/assets/sounds/join.mp3',
    quest_complete: '/assets/sounds/quest.mp3',
    click: '/assets/sounds/burst.mp3'
}

export const useSFX = create<SFXState>((set, get) => ({
    volume: 0.5,
    sounds: {},
    setVolume: (v) => set({ volume: v }),
    playSFX: (name) => {
        const sound = get().sounds[name]
        if (sound) {
            sound.volume(get().volume)
            sound.play()
        }
    },
    init: () => {
        const sounds: Record<string, Howl> = {}
        Object.entries(SFX_ASSETS).forEach(([key, url]) => {
            sounds[key] = new Howl({
                src: [url],
                preload: true,
            })
        })
        set({ sounds })
    }
}))
