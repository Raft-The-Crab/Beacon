import { Router } from 'express'
import { authenticate } from '../middleware/auth'
import { redis } from '../db'
import { aiSystem } from '../../ai'

const router = Router()

interface Note {
  id: string
  guildId: string
  title: string
  content: string
  createdBy: string
  collaborators: string[]
  musicClips: MusicClip[]
  createdAt: Date
  updatedAt: Date
}

interface MusicClip {
  id: string
  title: string
  artist: string
  url: string
  duration: number
  addedBy: string
}

interface ProfileNote {
  userId: string
  text: string
  emoji: string
  musicUrl: string | null
  musicMetadata: {
    title?: string
    artist?: string
    thumbnail?: string
    platform?: 'spotify' | 'youtube' | 'unknown'
    start?: number
    duration?: number
  } | null
  updatedAt: string
}

function buildDefaultProfileNote(userId: string): ProfileNote {
  return {
    userId,
    text: '',
    emoji: '✨',
    musicUrl: null,
    musicMetadata: null,
    updatedAt: new Date().toISOString(),
  }
}

// GET /api/notes/profile/me
router.get('/profile/me', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const raw = await redis.hget('profile_notes', userId)
    if (!raw) {
      return res.json({ note: buildDefaultProfileNote(userId) })
    }

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      return res.json({ note: parsed })
    } catch (parseError) {
      console.error('Failed to parse profile note JSON for user:', userId, raw)
      // Fallback to default instead of crashing the UI
      return res.json({ note: buildDefaultProfileNote(userId) })
    }
  } catch (error) {
    console.error('Notes Profile GET Error:', error)
    return res.json({ note: buildDefaultProfileNote(req.user?.id || 'unknown') })
  }
})

// GET /api/notes/profile/:userId
router.get('/profile/:userId', authenticate, async (req, res) => {
  try {
    const { userId } = req.params
    if (!userId) return res.status(400).json({ error: 'userId is required' })

    const raw = await redis.hget('profile_notes', userId)
    if (!raw) {
      return res.json({ note: buildDefaultProfileNote(userId) })
    }

    try {
      const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw
      return res.json({ note: parsed })
    } catch (parseError) {
      console.error('Failed to parse profile note for user:', userId)
      return res.json({ note: buildDefaultProfileNote(userId) })
    }
  } catch (error) {
    return res.json({ note: buildDefaultProfileNote(req.params.userId || 'unknown') })
  }
})

// PUT /api/notes/profile/me
router.put('/profile/me', authenticate, async (req, res) => {
  try {
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const { text, emoji, musicUrl, musicMetadata } = req.body || {}

    const note: ProfileNote = {
      userId,
      text: typeof text === 'string' ? text.slice(0, 140) : '',
      emoji: typeof emoji === 'string' && emoji.trim() ? emoji.slice(0, 16) : '✨',
      musicUrl: typeof musicUrl === 'string' && musicUrl.trim() ? musicUrl.trim() : null,
      musicMetadata: musicMetadata && typeof musicMetadata === 'object' ? musicMetadata : null,
      updatedAt: new Date().toISOString(),
    }

    await redis.hset('profile_notes', userId, JSON.stringify(note))
    return res.json({ note })
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update profile note' })
  }
})

// GET /api/notes/:guildId
router.get('/:guildId', authenticate, async (req, res) => {
  try {
    const { guildId } = req.params
    const notesKey = `notes:${guildId}`
    const notes = await redis.hgetall(notesKey)

    const parsed = Object.values(notes).map(n => JSON.parse(n as string))
    res.json({ notes: parsed })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' })
  }
})

// POST /api/notes/:guildId
router.post('/:guildId', authenticate, async (req, res) => {
  try {
    const { guildId } = req.params
    const { title, content } = req.body
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const note: Note = {
      id: `note_${Date.now()}`,
      guildId,
      title,
      content,
      createdBy: userId,
      collaborators: [userId],
      musicClips: [],
      createdAt: new Date(),
      updatedAt: new Date()
    }

    await redis.hset(`notes:${guildId}`, note.id, JSON.stringify(note))
    res.json({ note })
  } catch (error) {
    res.status(500).json({ error: 'Failed to create note' })
  }
})

// PUT /api/notes/:guildId/:noteId
router.put('/:guildId/:noteId', authenticate, async (req, res) => {
  try {
    const { guildId, noteId } = req.params
    const { title, content } = req.body

    const noteData = await redis.hget(`notes:${guildId}`, noteId)
    if (!noteData) return res.status(404).json({ error: 'Note not found' })

    const note: Note = JSON.parse(noteData)
    note.title = title || note.title
    note.content = content || note.content
    note.updatedAt = new Date()

    await redis.hset(`notes:${guildId}`, noteId, JSON.stringify(note))
    res.json({ note })
  } catch (error) {
    res.status(500).json({ error: 'Failed to update note' })
  }
})

// POST /api/notes/:guildId/:noteId/music
router.post('/:guildId/:noteId/music', authenticate, async (req, res) => {
  try {
    const { guildId, noteId } = req.params
    const { title, artist, url } = req.body
    const userId = req.user?.id
    if (!userId) return res.status(401).json({ error: 'Unauthorized' })

    const noteData = await redis.hget(`notes:${guildId}`, noteId)
    if (!noteData) return res.status(404).json({ error: 'Note not found' })

    const note: Note = JSON.parse(noteData)

    let finalUrl = url
    let finalTitle = title

    // Try to extract audio if it's a URL (yt-dlp handles many platforms)
    if (url.startsWith('http')) {
      const extraction = await aiSystem.extractAudio(url)
      if (extraction.success && extraction.url) {
        finalUrl = extraction.url
        finalTitle = extraction.title || finalTitle
      }
    }

    const clip: MusicClip = {
      id: `clip_${Date.now()}`,
      title: finalTitle,
      artist,
      url: finalUrl,
      duration: 30,
      addedBy: userId
    }

    note.musicClips.push(clip)
    note.updatedAt = new Date()

    await redis.hset(`notes:${guildId}`, noteId, JSON.stringify(note))
    res.json({ note })
  } catch (error) {
    res.status(500).json({ error: 'Failed to add music clip' })
  }
})

// DELETE /api/notes/:guildId/:noteId
router.delete('/:guildId/:noteId', authenticate, async (req, res) => {
  try {
    const { guildId, noteId } = req.params
    await redis.hdel(`notes:${guildId}`, noteId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' })
  }
})

export default router
