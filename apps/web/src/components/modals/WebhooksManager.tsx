import React, { useState, useEffect, useCallback } from 'react';
import styles from './WebhooksManager.module.css';

interface Webhook {
  id: string;
  name: string;
  token?: string;
  channelId: string;
  channelName?: string;
  avatarUrl?: string;
  url?: string;
  createdAt: string;
}

interface Channel {
  id: string;
  name: string;
  type: string;
}

interface WebhooksManagerProps {
  guildId: string;
  channels?: Channel[];
  onClose: () => void;
  /** When true, renders without the overlay backdrop — for use inside ServerSettings */
  embedded?: boolean;
}

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

function getToken() {
  return localStorage.getItem('token') || '';
}

async function apiFetch(path: string, options?: RequestInit) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getToken()}`,
      ...(options?.headers || {}),
    },
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
}

const WebhooksManager: React.FC<WebhooksManagerProps> = ({ guildId, channels = [], onClose, embedded }) => {
  const [webhooks, setWebhooks] = useState<Webhook[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Create form state
  const [newName, setNewName] = useState('');
  const [newChannel, setNewChannel] = useState(channels[0]?.id || '');
  const [createLoading, setCreateLoading] = useState(false);

  // Edit state
  const [editName, setEditName] = useState('');
  const [editChannel, setEditChannel] = useState('');
  const [editLoading, setEditLoading] = useState(false);

  const loadWebhooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiFetch(`/guilds/${guildId}/webhooks`);
      setWebhooks(data.webhooks || data || []);
    } catch (e: any) {
      setError(e.message || 'Failed to load webhooks');
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => { loadWebhooks(); }, [loadWebhooks]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newChannel) return;
    setCreateLoading(true);
    try {
      const wh = await apiFetch(`/channels/${newChannel}/webhooks`, {
        method: 'POST',
        body: JSON.stringify({ name: newName.trim() }),
      });
      setWebhooks(prev => [...prev, wh]);
      setNewName('');
      setCreating(false);
    } catch (e: any) {
      setError(e.message || 'Failed to create webhook');
    } finally {
      setCreateLoading(false);
    }
  };

  const handleEdit = async (wh: Webhook) => {
    setEditLoading(true);
    try {
      const updated = await apiFetch(`/webhooks/${wh.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ name: editName.trim(), channelId: editChannel }),
      });
      setWebhooks(prev => prev.map(w => w.id === wh.id ? { ...w, ...updated } : w));
      setEditingId(null);
    } catch (e: any) {
      setError(e.message || 'Failed to update webhook');
    } finally {
      setEditLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this webhook? This cannot be undone.')) return;
    setDeletingId(id);
    try {
      await apiFetch(`/webhooks/${id}`, { method: 'DELETE' });
      setWebhooks(prev => prev.filter(w => w.id !== id));
    } catch (e: any) {
      setError(e.message || 'Failed to delete webhook');
    } finally {
      setDeletingId(null);
    }
  };

  const startEdit = (wh: Webhook) => {
    setEditingId(wh.id);
    setEditName(wh.name);
    setEditChannel(wh.channelId);
  };

  const copyUrl = async (wh: Webhook) => {
    const url = wh.url || (wh.token ? `${API_BASE}/webhooks/${wh.id}/${wh.token}` : '');
    if (!url) return;
    await navigator.clipboard.writeText(url);
    setCopiedId(wh.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const textChannels = channels.filter(c => c.type === 'text' || !c.type);

  const content = (
    <div className={styles.modal}>
      <div className={styles.header}>
        <div className={styles.headerLeft}>
          <span className={styles.headerIcon}>🔗</span>
          <h2>Webhooks</h2>
        </div>
        {!embedded && (
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        )}
      </div>

      <div className={styles.description}>
        Webhooks allow external services to send messages into this server. Each webhook is tied to a specific channel.
      </div>

      {error && (
        <div className={styles.error}>
          <span>⚠️</span> {error}
          <button className={styles.errorClose} onClick={() => setError('')}>✕</button>
        </div>
      )}

      <div className={styles.body}>
        {loading ? (
          <div className={styles.loading}>
            <div className={styles.spinner} />
            <span>Loading webhooks…</span>
          </div>
        ) : (
          <>
            {webhooks.length === 0 && !creating && (
              <div className={styles.empty}>
                <span className={styles.emptyIcon}>🔗</span>
                <p>No webhooks yet. Create one to get started.</p>
              </div>
            )}

            {webhooks.map(wh => (
              <div key={wh.id} className={styles.webhookCard}>
                <div className={styles.webhookAvatar}>
                  {wh.avatarUrl
                    ? <img src={wh.avatarUrl} alt={wh.name} />
                    : <span>🤖</span>
                  }
                </div>

                {editingId === wh.id ? (
                  <div className={styles.editForm}>
                    <input
                      className={styles.editInput}
                      value={editName}
                      onChange={e => setEditName(e.target.value)}
                      placeholder="Webhook name"
                      maxLength={80}
                      autoFocus
                    />
                    <select
                      className={styles.editSelect}
                      value={editChannel}
                      onChange={e => setEditChannel(e.target.value)}
                    >
                      {textChannels.map(c => (
                        <option key={c.id} value={c.id}>#{c.name}</option>
                      ))}
                    </select>
                    <div className={styles.editActions}>
                      <button
                        className={styles.saveBtn}
                        onClick={() => handleEdit(wh)}
                        disabled={editLoading || !editName.trim()}
                      >
                        {editLoading ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        className={styles.cancelBtn}
                        onClick={() => setEditingId(null)}
                        disabled={editLoading}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={styles.webhookInfo}>
                      <div className={styles.webhookName}>{wh.name}</div>
                      <div className={styles.webhookMeta}>
                        #{wh.channelName || wh.channelId}
                        <span className={styles.dot}>·</span>
                        Created {new Date(wh.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <div className={styles.webhookActions}>
                      <button
                        className={styles.copyBtn}
                        onClick={() => copyUrl(wh)}
                        title="Copy webhook URL"
                      >
                        {copiedId === wh.id ? '✅ Copied' : '📋 Copy URL'}
                      </button>
                      <button
                        className={styles.editBtn}
                        onClick={() => startEdit(wh)}
                        title="Edit webhook"
                      >
                        ✏️
                      </button>
                      <button
                        className={styles.deleteBtn}
                        onClick={() => handleDelete(wh.id)}
                        disabled={deletingId === wh.id}
                        title="Delete webhook"
                      >
                        {deletingId === wh.id ? '…' : '🗑️'}
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}

            {creating && (
              <form className={styles.createForm} onSubmit={handleCreate}>
                <h3 className={styles.createTitle}>New Webhook</h3>
                <div className={styles.createRow}>
                  <div className={styles.field}>
                    <label className={styles.label}>Name</label>
                    <input
                      className={styles.input}
                      value={newName}
                      onChange={e => setNewName(e.target.value)}
                      placeholder="My Webhook"
                      maxLength={80}
                      required
                      autoFocus
                    />
                  </div>
                  <div className={styles.field}>
                    <label className={styles.label}>Channel</label>
                    <select
                      className={styles.select}
                      value={newChannel}
                      onChange={e => setNewChannel(e.target.value)}
                      required
                    >
                      {textChannels.length === 0
                        ? <option value="">No text channels</option>
                        : textChannels.map(c => (
                            <option key={c.id} value={c.id}>#{c.name}</option>
                          ))
                      }
                    </select>
                  </div>
                </div>
                <div className={styles.createActions}>
                  <button
                    type="submit"
                    className={styles.createSubmitBtn}
                    disabled={createLoading || !newName.trim()}
                  >
                    {createLoading ? 'Creating…' : 'Create Webhook'}
                  </button>
                  <button
                    type="button"
                    className={styles.cancelBtn}
                    onClick={() => { setCreating(false); setNewName(''); }}
                    disabled={createLoading}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </>
        )}
      </div>

      <div className={styles.footer}>
        {!creating && (
          <button className={styles.newWebhookBtn} onClick={() => setCreating(true)}>
            + New Webhook
          </button>
        )}
        <button className={styles.doneBtn} onClick={onClose}>Done</button>
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      {content}
    </div>
  );
};

export default WebhooksManager;
