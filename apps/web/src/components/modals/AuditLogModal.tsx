import { useEffect, useState } from 'react';
import styles from './AuditLogModal.module.css';
import { api } from '../../lib/api';

interface AuditEntry {
  id: string;
  action: number;
  userId: string;
  targetId: string;
  reason: string;
  changes?: any;
  createdAt: string;
  user?: { id: string; username: string; avatar: string | null };
}

const ACTION_NAMES: Record<number, string> = {
  1: 'Guild Updated',
  10: 'Channel Created',
  11: 'Channel Updated',
  12: 'Channel Deleted',
  20: 'Member Kicked',
  22: 'Member Banned',
  23: 'Member Unbanned',
  24: 'Member Updated',
  25: 'Member Role Updated',
  30: 'Role Created',
  31: 'Role Updated',
  32: 'Role Deleted',
  40: 'Invite Created',
  42: 'Invite Deleted',
  50: 'Webhook Created',
  51: 'Webhook Updated',
  52: 'Webhook Deleted',
  60: 'Message Pinned',
  61: 'Message Unpinned',
  62: 'Message Deleted',
  72: 'Message Bulk Deleted',
};

const ACTION_COLORS: Record<number, string> = {
  20: '#f23f43', 22: '#f23f43', 62: '#f23f43', 72: '#f23f43', 42: '#f23f43', 32: '#f23f43', 12: '#f23f43',
  1: '#f0b232', 11: '#f0b232', 24: '#f0b232', 25: '#f0b232', 31: '#f0b232', 51: '#f0b232',
};

interface Props {
  guildId: string;
  guildName?: string;
  onClose: () => void;
  /** When true, renders without the overlay backdrop — for use inside ServerSettings */
  embedded?: boolean;
}

export function AuditLogModal({ guildId, guildName, onClose, embedded }: Props) {
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<number | ''>('');

  useEffect(() => {
    loadLogs();
  }, [guildId]);

  const loadLogs = async () => {
    setLoading(true);
    try {
      const { data } = await api.get(`/audit-logs/${guildId}`);
      setLogs(data);
    } catch (err) {
      console.error('Failed to load audit logs:', err);
    } finally {
      setLoading(false);
    }
  };

  const filtered = filter !== '' ? logs.filter((l) => l.action === Number(filter)) : logs;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionColor = (action: number) => ACTION_COLORS[action] || '#23a55a';

  const content = (
    <div className={embedded ? styles.embeddedRoot : styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <div>
          <h2>Audit Log</h2>
          {guildName && <p className={styles.guildName}>{guildName}</p>}
        </div>
        {!embedded && (
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        )}
      </div>

      <div className={styles.toolbar}>
        <select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_NAMES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </select>
        <button className={styles.refreshBtn} onClick={loadLogs}>↻ Refresh</button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.center}><div className={styles.spinner} /></div>
        ) : filtered.length === 0 ? (
          <div className={styles.center}>
            <p>No audit log entries found</p>
          </div>
        ) : (
          filtered.map((entry) => (
            <div key={entry.id} className={styles.entry}>
              <div className={styles.entryLeft}>
                <span
                  className={styles.actionBadge}
                  style={{ background: getActionColor(entry.action) + '22', color: getActionColor(entry.action) }}
                >
                  {ACTION_NAMES[entry.action] ?? `Action ${entry.action}`}
                </span>
                <div className={styles.entryDetails}>
                  <span className={styles.byUser}>
                    by <strong>{entry.user?.username ?? entry.userId}</strong>
                  </span>
                  {entry.reason && (
                    <span className={styles.reason}>"{entry.reason}"</span>
                  )}
                  {entry.targetId && (
                    <span className={styles.target}>Target: {entry.targetId.slice(0, 12)}…</span>
                  )}
                </div>
              </div>
              <span className={styles.date}>{formatDate(entry.createdAt)}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );

  if (embedded) {
    return content;
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      {content}
    </div>
  );
}
