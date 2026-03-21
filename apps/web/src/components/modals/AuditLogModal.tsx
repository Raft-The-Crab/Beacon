import { useEffect, useState, useCallback } from 'react';
import styles from '../../styles/modules/modals/AuditLogModal.module.css';
import { apiClient } from '../../services/apiClient';
import { Spinner, Select } from '../ui';
import { FileText, RefreshCw, X, User, ShieldAlert } from 'lucide-react';

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
  21: 'Member Banned',
  22: 'Member Unbanned',
  23: 'Member Updated',
  24: 'Member Role Updated',
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
  20: '#f23f43', 21: '#f23f43', 62: '#f23f43', 72: '#f23f43', 42: '#f23f43', 32: '#f23f43', 12: '#f23f43',
  1: '#f0b232', 11: '#f0b232', 23: '#f0b232', 24: '#f0b232', 31: '#f0b232', 51: '#f0b232',
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

  const loadLogs = useCallback(async () => {
    setLoading(true);
    const res = await apiClient.getAuditLogs(guildId);
    if (res.success) {
      setLogs(res.data);
    }
    setLoading(false);
  }, [guildId]);

  useEffect(() => {
    loadLogs();
  }, [loadLogs]);

  const filtered = filter !== '' ? logs.filter((l) => l.action === Number(filter)) : logs;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  const getActionColor = (action: number) => ACTION_COLORS[action] || '#23a55a';

  const content = (
    <div className={embedded ? styles.embeddedRoot : styles.modal} onClick={(e) => e.stopPropagation()}>
      <div className={styles.header}>
        <div className={styles.headerTitleContainer}>
          <FileText size={20} className={styles.headerIcon} />
          <div>
            <h2>Audit Log</h2>
            {guildName && <p className={styles.guildName}>{guildName}</p>}
          </div>
        </div>
        {!embedded && (
          <button className={styles.closeBtn} onClick={onClose}><X size={18} /></button>
        )}
      </div>

      <div className={styles.toolbar}>
        <Select
          className={styles.filterSelect}
          value={filter}
          onChange={(e) => setFilter(e.target.value === '' ? '' : Number(e.target.value))}
        >
          <option value="">All Actions</option>
          {Object.entries(ACTION_NAMES).map(([code, name]) => (
            <option key={code} value={code}>{name}</option>
          ))}
        </Select>
        <button className={styles.refreshBtn} onClick={loadLogs}>
          <RefreshCw size={14} style={{ marginRight: 6 }} /> Refresh
        </button>
      </div>

      <div className={styles.list}>
        {loading ? (
          <div className={styles.center}><Spinner size="lg" /></div>
        ) : filtered.length === 0 ? (
          <div className={styles.center}>
            <ShieldAlert size={48} style={{ opacity: 0.1, marginBottom: 16 }} />
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
