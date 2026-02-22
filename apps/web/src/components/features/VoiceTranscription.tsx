import { useState, useEffect } from 'react'

interface TranscriptLine {
  userId: string
  username: string
  text: string
  timestamp: Date
}

export function VoiceTranscription({ channelId: _channelId }: { channelId: string }) {
  const [transcript, setTranscript] = useState<TranscriptLine[]>([])
  const [isEnabled, setIsEnabled] = useState(false)

  useEffect(() => {
    if (!isEnabled) return

    // Web Speech API
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) {
      console.error('Speech recognition not supported')
      return
    }

    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    recognition.onresult = (event: any) => {
      const last = event.results.length - 1
      const text = event.results[last][0].transcript

      if (event.results[last].isFinal) {
        setTranscript(prev => [...prev, {
          userId: 'current_user',
          username: 'You',
          text,
          timestamp: new Date()
        }])
      }
    }

    recognition.start()

    return () => recognition.stop()
  }, [isEnabled])

  return (
    <div style={{ padding: '1rem', background: 'var(--bg-secondary)', borderRadius: '8px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
        <h3>Live Transcription</h3>
        <button onClick={() => setIsEnabled(!isEnabled)}>
          {isEnabled ? 'Stop' : 'Start'}
        </button>
      </div>
      <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
        {transcript.map((line, i) => (
          <div key={i} style={{ marginBottom: '0.5rem' }}>
            <strong>{line.username}</strong>: {line.text}
            <span style={{ fontSize: '0.75rem', opacity: 0.6, marginLeft: '0.5rem' }}>
              {line.timestamp.toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
