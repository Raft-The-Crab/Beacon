import React, { useState, useEffect, useRef } from 'react';
import styles from './GroupDMModal.module.css';
import { useNavigate } from 'react-router-dom';

interface Friend {
  id: string;
  username: string;
  displayName?: string;
  avatarUrl?: string;
  status?: string;
}

interface GroupDMModalProps {
  friends?: Friend[];
  onClose: () => void;
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

const MAX_MEMBERS = 9; // 10 total including self

const GroupDMModal: React.FC<GroupDMModalProps> = ({ friends = [], onClose }) => {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Friend[]>([]);
  const [groupName, setGroupName] = useState('');
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const [allFriends, setAllFriends] = useState<Friend[]>(friends);
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // If no friends provided, fetch them
    if (friends.length === 0) {
      apiFetch('/users/me/friends')
        .then(data => setAllFriends(data.friends || data || []))
        .catch(() => { });
    }
    searchRef.current?.focus();
  }, []);

  const filtered = allFriends.filter(f => {
    const q = search.toLowerCase();
    return (
      f.username.toLowerCase().includes(q) ||
      (f.displayName || '').toLowerCase().includes(q)
    );
  });

  const toggle = (friend: Friend) => {
    setSelected(prev => {
      if (prev.find(f => f.id === friend.id)) {
        return prev.filter(f => f.id !== friend.id);
      }
      if (prev.length >= MAX_MEMBERS) return prev;
      return [...prev, friend];
    });
  };

  const isSelected = (id: string) => selected.some(f => f.id === id);

  const handleCreate = async () => {
    if (selected.length === 0) return;
    setCreating(true);
    setError('');
    try {
      const recipients = selected.map(f => f.id);
      const data = await apiFetch('/channels/group-dm', {
        method: 'POST',
        body: JSON.stringify({
          recipients,
          name: groupName.trim() || undefined,
        }),
      });
      onClose();
      navigate(`/channels/@me/${data.id}`);
    } catch (e: any) {
      setError(e.message || 'Failed to create group DM');
    } finally {
      setCreating(false);
    }
  };

  const statusColors: Record<string, string> = {
    online: '#23a55a',
    idle: '#f0b232',
    dnd: '#f23f43',
    invisible: '#80848e',
    offline: '#80848e',
  };

  return (
    <div className={styles.overlay} onClick={e => e.target === e.currentTarget && onClose()}>
      <div className={styles.modal}>
        <div className={styles.header}>
          <h2>New Group DM</h2>
          <button className={styles.closeBtn} onClick={onClose}>✕</button>
        </div>

        <div className={styles.subheader}>
          You can add up to {MAX_MEMBERS} friends to a group DM.
        </div>

        {/* Group name input */}
        <div className={styles.nameSection}>
          <input
            className={styles.nameInput}
            value={groupName}
            onChange={e => setGroupName(e.target.value)}
            placeholder="Group DM name (optional)"
            maxLength={100}
          />
        </div>

        {/* Selected chips */}
        {selected.length > 0 && (
          <div className={styles.selectedList}>
            {selected.map(f => (
              <div key={f.id} className={styles.chip}>
                <img
                  className={styles.chipAvatar}
                  src={f.avatarUrl || undefined}
                  alt={f.username}
                />
                <span className={styles.chipName}>{f.displayName || f.username}</span>
                <button className={styles.chipRemove} onClick={() => toggle(f)}>✕</button>
              </div>
            ))}
          </div>
        )}

        {/* Search */}
        <div className={styles.searchWrapper}>
          <span className={styles.searchIcon}>🔍</span>
          <input
            ref={searchRef}
            className={styles.searchInput}
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search for friends…"
          />
        </div>

        {/* Friends list */}
        <div className={styles.friendList}>
          {filtered.length === 0 ? (
            <div className={styles.empty}>
              {search ? 'No friends found' : 'No friends available'}
            </div>
          ) : (
            filtered.map(f => (
              <div
                key={f.id}
                className={`${styles.friendRow} ${isSelected(f.id) ? styles.friendRowSelected : ''}`}
                onClick={() => toggle(f)}
              >
                <div className={styles.avatarWrap}>
                  <img
                    className={styles.avatar}
                    src={f.avatarUrl || undefined}
                    alt={f.username}
                  />
                  <span
                    className={styles.statusDot}
                    style={{ background: statusColors[f.status || 'offline'] }}
                  />
                </div>
                <div className={styles.friendInfo}>
                  <span className={styles.friendName}>{f.displayName || f.username}</span>
                  {f.displayName && (
                    <span className={styles.friendHandle}>@{f.username}</span>
                  )}
                </div>
                <div className={`${styles.checkbox} ${isSelected(f.id) ? styles.checkboxChecked : ''}`}>
                  {isSelected(f.id) && <span>✓</span>}
                </div>
              </div>
            ))
          )}
        </div>

        {error && (
          <div className={styles.error}>⚠️ {error}</div>
        )}

        <div className={styles.footer}>
          <span className={styles.counter}>
            {selected.length}/{MAX_MEMBERS} selected
          </span>
          <button
            className={styles.createBtn}
            onClick={handleCreate}
            disabled={selected.length === 0 || creating}
          >
            {creating ? 'Creating…' : 'Create Group DM'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default GroupDMModal;
