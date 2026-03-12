import { useState, useEffect } from 'react'
import { Plus, Edit3, Trash2, Music, X, Save, FileText, Clock, ExternalLink, Loader2, Sparkles } from 'lucide-react'
import { apiClient } from '../../services/apiClient'
import styles from '../../styles/modules/features/Notes.module.css'

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
  const [isExtracting, setIsExtracting] = useState(false)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotes()
  }, [guildId])

  const fetchNotes = async () => {
    setLoading(true)
    const res = await apiClient.request('GET', `/notes/${guildId}`)
    if (res.success) {
      setNotes(res.data.notes || [])
    }
    setLoading(false)
  }

  const createNote = async () => {
    const res = await apiClient.request('POST', `/notes/${guildId}`, { 
      title: 'Untilted Note', 
      content: 'Start writing something amazing...' 
    })
    if (res.success) {
      fetchNotes()
    }
  }

  const updateNote = async () => {
    if (!selectedNote) return
    const res = await apiClient.request('PUT', `/notes/${guildId}/${selectedNote.id}`, { title, content })
    if (res.success) {
      setIsEditing(false)
      fetchNotes()
    }
  }

  const addCustomMusic = async () => {
    if (!selectedNote || !customUrl) return
    setIsExtracting(true)
    try {
      const res = await apiClient.request('POST', `/notes/${guildId}/${selectedNote.id}/music`, {
        title: customTitle || 'Custom Track',
        artist: 'Beacon AI',
        url: customUrl
      })
      if (res.success) {
        setCustomUrl('')
        setCustomTitle('')
        setShowMusicPicker(false)
        fetchNotes()
      }
    } catch (error) {
      console.error('Failed to add music:', error)
    } finally {
      setIsExtracting(false)
    }
  }

  const deleteNote = async (noteId: string) => {
    const res = await apiClient.request('DELETE', `/notes/${guildId}/${noteId}`)
    if (res.success) {
      setSelectedNote(null)
      fetchNotes()
    }
  }

  return (
    <div className={styles.container}>
      <div className={styles.sidebar}>
        <div className={styles.sidebarHeader}>
          <h3>My Notes</h3>
          <button onClick={createNote} className={styles.createBtn}>
            <Plus size={18} />
          </button>
        </div>
        
        <div className={styles.notesList}>
          {loading ? (
            <div className={styles.loadingList}>
              <Loader2 className={styles.spin} />
            </div>
          ) : notes.length === 0 ? (
            <div className={styles.emptyList}>No notes found</div>
          ) : (
            notes.map((note: Note) => (
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
                <div className={styles.noteItemIcon}>
                  <FileText size={16} />
                </div>
                <div className={styles.noteItemContent}>
                  <h4>{note.title}</h4>
                  <span>
                    <Clock size={10} />
                    {new Date(note.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className={styles.editor}>
        {selectedNote ? (
          <div className={styles.editorWrapper}>
            <div className={styles.header}>
              <div className={styles.titleArea}>
                {isEditing ? (
                  <input
                    value={title}
                    onChange={e => setTitle(e.target.value)}
                    className={styles.titleInput}
                    placeholder="Note Title"
                  />
                ) : (
                  <h2>{selectedNote.title}</h2>
                )}
              </div>
              <div className={styles.actions}>
                <button 
                  onClick={() => setShowMusicPicker(true)} 
                  className={styles.musicBtn}
                  title="Add Background Music"
                >
                  <Music size={18} />
                </button>
                {isEditing ? (
                  <button onClick={updateNote} className={styles.saveBtn} title="Save Changes">
                    <Save size={18} />
                  </button>
                ) : (
                  <button onClick={() => setIsEditing(true)} className={styles.editBtn} title="Edit Note">
                    <Edit3 size={18} />
                  </button>
                )}
                <button onClick={() => deleteNote(selectedNote.id)} className={styles.deleteBtn} title="Delete Note">
                  <Trash2 size={18} />
                </button>
              </div>
            </div>

            <div className={styles.contentArea}>
              {isEditing ? (
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  className={styles.contentInput}
                  placeholder="Write your note..."
                />
              ) : (
                <div className={styles.contentView}>{selectedNote.content}</div>
              )}
            </div>

            {selectedNote.musicClips.length > 0 && (
              <div className={styles.musicSection}>
                <div className={styles.sectionHeader}>
                  <Music size={16} />
                  <h3>Audio Attachments</h3>
                </div>
                <div className={styles.clipsGrid}>
                  {selectedNote.musicClips.map((clip: MusicClip) => (
                    <div key={clip.id} className={styles.clipItem}>
                      <div className={styles.clipInfo}>
                        <span className={styles.clipTitle}>{clip.title}</span>
                        <span className={styles.clipArtist}>{clip.artist}</span>
                      </div>
                      <audio controls preload="none" src={clip.url} className={styles.audioPlayer} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {showMusicPicker && (
              <div className={styles.modalOverlay} onClick={() => setShowMusicPicker(false)}>
                <div className={styles.modalContent} onClick={e => e.stopPropagation()}>
                  <div className={styles.modalHeader}>
                    <div className={styles.modalTitle}>
                      <Sparkles size={20} className={styles.aiIcon} />
                      <h3>AI Magic Extractor</h3>
                    </div>
                    <button onClick={() => setShowMusicPicker(false)} className={styles.closeBtn}>
                      <X size={20} />
                    </button>
                  </div>
                  
                  <div className={styles.modalBody}>
                    <p>Enter any URL to extract audio automatically.</p>
                    <div className={styles.inputGroup}>
                      <label>Track Title</label>
                      <input
                        type="text"
                        placeholder="Optional title..."
                        value={customTitle}
                        onChange={e => setCustomTitle(e.target.value)}
                      />
                    </div>
                    <div className={styles.inputGroup}>
                      <label>Platform URL</label>
                      <input
                        type="url"
                        placeholder="YouTube, Soundcloud, etc..."
                        value={customUrl}
                        onChange={e => setCustomUrl(e.target.value)}
                        autoFocus
                      />
                    </div>
                    
                    <div className={styles.modalActions}>
                      <button 
                        onClick={addCustomMusic} 
                        className={styles.primaryBtn}
                        disabled={isExtracting || !customUrl}
                      >
                        {isExtracting ? (
                          <>
                            <Loader2 className={styles.spin} size={18} />
                            Extracting...
                          </>
                        ) : (
                          'Start Extraction'
                        )}
                      </button>
                      <button onClick={() => setShowMusicPicker(false)} className={styles.secondaryBtn}>
                        Cancel
                      </button>
                    </div>
                    <div className={styles.hint}>
                      <ExternalLink size={12} />
                      Supports 1000+ streaming sites via Beacon AI Cluster
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <div className={styles.emptyIcon}>
              <FileText size={48} />
            </div>
            <h2>Select a note to viewpoint</h2>
            <p>Or create a new one to start documenting your journey.</p>
            <button onClick={createNote} className={styles.createBtnLarge}>
              <Plus size={18} />
              Create New Note
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
