import React, { useState, useEffect } from 'react'
import { api } from '../../lib/api'
import styles from './Notes.module.css'

interface Note {
  id: string
  title: string
  content: string
  musicClips: MusicClip[]
  createdBy: string
  updatedAt: string
}

interface MusicClip {
  id: string
  title: string
  artist: string
  url: string
  duration: number
}

export function Notes({ guildId }: { guildId: string }) {
  const [notes, setNotes] = useState<Note[]>([])
  const [selectedNote, setSelectedNote] = useState<Note | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [showMusicPicker, setShowMusicPicker] = useState(false)
  const [customUrl, setCustomUrl] = useState('')
  const [customTitle, setCustomTitle] = useState('')

  useEffect(() => {
    fetchNotes()
  }, [guildId])

  const fetchNotes = async () => {
    const res = await api.get(`/notes/${guildId}`)
    setNotes(res.data.notes || [])
  }

  const createNote = async () => {
    await api.post(`/notes/${guildId}`, { title: 'New Note', content: '' })
    fetchNotes()
  }

  const updateNote = async () => {
    if (!selectedNote) return
    await api.put(`/notes/${guildId}/${selectedNote.id}`, { title, content })
    setIsEditing(false)
    fetchNotes()
  }

  const addCustomMusic = async () => {
    if (!selectedNote || !customUrl) return
    await api.post(`/notes/${guildId}/${selectedNote.id}/music`, {
      title: customTitle || 'Custom Track',
      artist: 'User Upload',
      url: customUrl
    })
    setCustomUrl('')
    setCustomTitle('')
    setShowMusicPicker(false)
    fetchNotes()
  }

  const deleteNote = async (noteId: string) => {
    await api.delete(`/notes/${guildId}/${noteId}`)
    setSelectedNote(null)
    fetchNotes()
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <button onClick={createNote} className={styles.createBtn}>+ New Note</button>
        <div className={styles.notesList}>
          {notes.map(note => (
            <div
              key={note.id}
              className={`${styles.noteItem} ${selectedNote?.id === note.id ? styles.active : ''}`}
              onClick={() => {
                setSelectedNote(note)
                setTitle(note.title)
                setContent(note.content)
                setIsEditing(false)
              }}
            >
              <h4>{note.title}</h4>
              <p>{new Date(note.updatedAt).toLocaleDateString()}</p>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.editor}>
        {selectedNote ? (
          <>
            <div className={styles.header}>
              {isEditing ? (
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className={styles.titleInput}
                />
              ) : (
                <h2>{selectedNote.title}</h2>
              )}
              <div className={styles.actions}>
                {isEditing ? (
                  <button onClick={updateNote} className={styles.saveBtn}>Save</button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className={styles.editBtn}>Edit</button>
                )}
                <button onClick={() => setShowMusicPicker(true)} className={styles.musicBtn}>🎵</button>
                <button onClick={() => deleteNote(selectedNote.id)} className={styles.deleteBtn}>×</button>
              </div>
            </div>

            {isEditing ? (
              <textarea
                value={content}
                onChange={e => setContent(e.target.value)}
                className={styles.contentInput}
                placeholder="Write your note..."
              />
            ) : (
              <div className={styles.content}>{selectedNote.content}</div>
            )}

            {selectedNote.musicClips.length > 0 && (
              <div className={styles.musicClips}>
                <h3>Music</h3>
                {selectedNote.musicClips.map(clip => (
                  <div key={clip.id} className={styles.clip}>
                    <span>{clip.title}</span>
                    <audio controls preload="none" src={clip.url} />
                  </div>
                ))}
              </div>
            )}

            {showMusicPicker && (
              <div className={styles.musicPicker}>
                <h3>Add Music</h3>
                <input
                  type="text"
                  placeholder="Track title"
                  value={customTitle}
                  onChange={e => setCustomTitle(e.target.value)}
                  className={styles.input}
                />
                <input
                  type="url"
                  placeholder="Music URL (YouTube, Spotify, SoundCloud, etc.)"
                  value={customUrl}
                  onChange={e => setCustomUrl(e.target.value)}
                  className={styles.input}
                />
                <div className={styles.pickerActions}>
                  <button onClick={addCustomMusic} className={styles.addBtn}>Add</button>
                  <button onClick={() => setShowMusicPicker(false)} className={styles.cancelBtn}>Cancel</button>
                </div>
                <p className={styles.hint}>Supports: YouTube, Spotify, SoundCloud, MP3 links</p>
              </div>
            )}
          </>
        ) : (
          <div className={styles.empty}>Select a note</div>
        )}
      </div>
    </div>
  )
}
