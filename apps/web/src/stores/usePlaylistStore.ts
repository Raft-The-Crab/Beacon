import { create } from 'zustand'

interface Track {
  id: string
  title: string
  artist: string
  duration: number
  addedBy: string
  votes: { up: string[]; down: string[] }
  url: string
}

interface PlaylistStore {
  tracks: Track[]
  currentTrack: Track | null
  isPlaying: boolean
  
  addTrack: (track: Omit<Track, 'id' | 'votes'>) => void
  removeTrack: (trackId: string) => void
  vote: (trackId: string, userId: string, direction: 'up' | 'down') => void
  play: (trackId: string) => void
  pause: () => void
  next: () => void
  getQueue: () => Track[]
}

export const usePlaylistStore = create<PlaylistStore>((set, get) => ({
  tracks: [],
  currentTrack: null,
  isPlaying: false,

  addTrack: (track) => {
    const newTrack: Track = {
      ...track,
      id: Date.now().toString(),
      votes: { up: [], down: [] }
    }
    set(state => ({ tracks: [...state.tracks, newTrack] }))
  },

  removeTrack: (trackId) => {
    set(state => ({
      tracks: state.tracks.filter(t => t.id !== trackId)
    }))
  },

  vote: (trackId, userId, direction) => {
    set(state => ({
      tracks: state.tracks.map(track => {
        if (track.id !== trackId) return track

        const votes = { ...track.votes }
        const opposite = direction === 'up' ? 'down' : 'up'

        // Remove from opposite
        votes[opposite] = votes[opposite].filter(id => id !== userId)

        // Toggle current direction
        if (votes[direction].includes(userId)) {
          votes[direction] = votes[direction].filter(id => id !== userId)
        } else {
          votes[direction] = [...votes[direction], userId]
        }

        return { ...track, votes }
      })
    }))
  },

  play: (trackId) => {
    const track = get().tracks.find(t => t.id === trackId)
    if (track) {
      set({ currentTrack: track, isPlaying: true })
    }
  },

  pause: () => {
    set({ isPlaying: false })
  },

  next: () => {
    const queue = get().getQueue()
    if (queue.length > 0) {
      get().play(queue[0].id)
    }
  },

  getQueue: () => {
    return get().tracks
      .filter(t => t.id !== get().currentTrack?.id)
      .sort((a, b) => {
        const scoreA = a.votes.up.length - a.votes.down.length
        const scoreB = b.votes.up.length - b.votes.down.length
        return scoreB - scoreA
      })
  }
}))
