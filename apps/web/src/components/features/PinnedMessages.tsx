import { useEffect, useState } from 'react';
import styles from './PinnedMessages.module.css';
import { api } from '../../lib/api';

interface Message {
  id: string;
  content: string;
  author: { id: string; username: string; avatar: string | null };
  createdAt: string;
  pinned: boolean;
}

interface Props {
  channelId: string;
  channelName?: string;
  onClose: () => void;
  onJumpToMessage?: (messageId: string) => void;
}

export function PinnedMessages({ channelId, channelName, onClose, onJumpToMessage }: Props) {
  const [pins, setPins] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    loadPins();
  }, [channelId]);

  const loadPins = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/channels/${channelId}/pins`);
      setPins(data);
    } catch (err) {
      console.error('Failed to load pinned messages:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUnpin = async (messageId: string) => {
    try {
      await api.delete(`/channels/${channelId}/pins/${messageId}`);
      setPins((prev) => prev.filter((m) => m.id !== messageId));
    } catch (err) {
      console.error('Failed to unpin message:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className={styles.panel}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.pinIcon}>📌</span>
          <h3>Pinned Messages</h3>
          {channelName && <span className={styles.channelName}>#{channelName}</span>}
        </div>
        <button className={styles.closeBtn} onClick={onClose}>✕</button>
      </div>

      <div className={styles.content}>
        {loading ? (
          <div className={styles.empty}>
            <div className={styles.spinner} />
            <p>Loading pins…</p>
          </div>
        ) : pins.length === 0 ? (
          <div className={styles.empty}>
            <span className={styles.emptyIcon}>📌</span>
            <p>No pinned messages yet</p>
            <span className={styles.emptyHint}>Right-click any message to pin it</span>
          </div>
        ) : (
          <div className={styles.list}>
            {pins.map((msg) => (
              <div key={msg.id} className={styles.pinItem}>
                <div className={styles.pinMeta}>
                  <div className={styles.author}>
                    <div
                      className={styles.avatar}
                      style={{
                        background: msg.author.avatar
                          ? `url(${msg.author.avatar}) center/cover`
                          : `hsl(${parseInt(msg.author.id, 16) % 360}deg 60% 50%)`,
                      }}
                    />
                    <span className={styles.authorName}>{msg.author.username}</span>
                    <span className={styles.date}>{formatDate(msg.createdAt)}</span>
                  </div>
                  <div className={styles.pinActions}>
                    {onJumpToMessage && (
                      <button
                        className={styles.jumpBtn}
                        onClick={() => { onJumpToMessage(msg.id); onClose(); }}
                        title="Jump to message"
                      >
                        ↗
                      </button>
                    )}
                    <button
                      className={styles.unpinBtn}
                      onClick={() => handleUnpin(msg.id)}
                      title="Unpin message"
                    >
                      ✕
                    </button>
                  </div>
                </div>
                <p className={styles.content}>{msg.content || <em className={styles.noContent}>Media or embed</em>}</p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
