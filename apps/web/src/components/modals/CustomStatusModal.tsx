import { useState } from 'react';
import styles from './CustomStatusModal.module.css';
import { useAuthStore } from '../../stores/useAuthStore';
import { api } from '../../lib/api';

interface Props {
  onClose: () => void;
}

type Status = 'online' | 'idle' | 'dnd' | 'invisible';

const STATUS_OPTIONS: { value: Status; label: string; color: string; description: string }[] = [
  { value: 'online', label: 'Online', color: '#23a55a', description: 'Active and available' },
  { value: 'idle', label: 'Idle', color: '#f0b232', description: 'Away from keyboard' },
  { value: 'dnd', label: 'Do Not Disturb', color: '#f23f43', description: 'Mute notifications' },
  { value: 'invisible', label: 'Invisible', color: '#80848e', description: 'Appear offline' },
];

const QUICK_STATUSES = [
  '🎮 Gaming',
  '🎵 Listening to music',
  '💻 Coding',
  '☕ Taking a break',
  '📚 Studying',
  '🏃 Exercising',
  '🎬 Watching something',
  '😴 Sleeping soon',
];

export function CustomStatusModal({ onClose }: Props) {
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);

  const [status, setStatus] = useState<Status>((user?.status as Status) || 'online');
  const [customStatus, setCustomStatus] = useState(user?.customStatus || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: updated } = await api.patch('/users/me', { status, customStatus });
      setUser({ ...user!, ...updated });
      onClose();
    } catch (err) {
      console.error('Failed to update status:', err);
    } finally {
      setSaving(false);
    }
  };

  const clearStatus = async () => {
    setCustomStatus('');
    setSaving(true);
    try {
      const { data: updated } = await api.patch('/users/me', { customStatus: null });
      setUser({ ...user!, ...updated });
      onClose();
    } catch (_) {} finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <h2>Set Status</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        {/* Presence Status */}
        <div className={styles.section}>
          <p className={styles.label}>STATUS</p>
          <div className={styles.statusGrid}>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.statusOption} ${status === opt.value ? styles.active : ''}`}
                onClick={() => setStatus(opt.value)}
              >
                <span className={styles.dot} style={{ background: opt.color }} />
                <div>
                  <span className={styles.statusLabel}>{opt.label}</span>
                  <span className={styles.statusDesc}>{opt.description}</span>
                </div>
                {status === opt.value && <span className={styles.check}>✓</span>}
              </button>
            ))}
          </div>
        </div>

        {/* Custom status text */}
        <div className={styles.section}>
          <p className={styles.label}>CUSTOM STATUS</p>
          <div className={styles.inputWrapper}>
            <input
              className={styles.input}
              placeholder="What's on your mind?"
              value={customStatus}
              onChange={(e) => setCustomStatus(e.target.value.slice(0, 128))}
              maxLength={128}
            />
            {customStatus && (
              <button className={styles.clearInput} onClick={() => setCustomStatus('')}>✕</button>
            )}
          </div>
          <p className={styles.charCount}>{customStatus.length}/128</p>

          {/* Quick suggestions */}
          <div className={styles.quickSuggestions}>
            {QUICK_STATUSES.map((s) => (
              <button
                key={s}
                className={styles.suggestion}
                onClick={() => setCustomStatus(s)}
              >
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.actions}>
          {user?.customStatus && (
            <button className={styles.clearBtn} onClick={clearStatus} disabled={saving}>
              Clear Status
            </button>
          )}
          <div className={styles.actionRight}>
            <button className={styles.cancelBtn} onClick={onClose}>Cancel</button>
            <button className={styles.saveBtn} onClick={handleSave} disabled={saving}>
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
