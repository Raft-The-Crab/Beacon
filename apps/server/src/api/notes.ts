import { Router } from 'express'
import { authMiddleware } from '../middleware/auth'
import { redis } from '../db'

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

// GET /api/notes/:guildId
router.get('/:guildId', authMiddleware, async (req, res) => {
  try {
    const { guildId } = req.params
    const notesKey = `notes:${guildId}`
    const notes = await redis.hgetall(notesKey)
    
    const parsed = Object.values(notes).map(n => JSON.parse(n))
    res.json({ notes: parsed })
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch notes' })
  }
})

// POST /api/notes/:guildId
router.post('/:guildId', authMiddleware, async (req, res) => {
  try {
    const { guildId } = req.params
    const { title, content } = req.body
    const userId = (req as any).user.id

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
router.put('/:guildId/:noteId', authMiddleware, async (req, res) => {
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
router.post('/:guildId/:noteId/music', authMiddleware, async (req, res) => {
  try {
    const { guildId, noteId } = req.params
    const { title, artist, url } = req.body
    const userId = (req as any).user.id

    const noteData = await redis.hget(`notes:${guildId}`, noteId)
    if (!noteData) return res.status(404).json({ error: 'Note not found' })

    const note: Note = JSON.parse(noteData)
    
    const clip: MusicClip = {
      id: `clip_${Date.now()}`,
      title,
      artist,
      url,
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
router.delete('/:guildId/:noteId', authMiddleware, async (req, res) => {
  try {
    const { guildId, noteId } = req.params
    await redis.hdel(`notes:${guildId}`, noteId)
    res.json({ success: true })
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete note' })
  }
})

export default router
