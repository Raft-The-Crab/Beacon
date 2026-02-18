/**
 * Friends UI Component
 */

import React, { useEffect, useState } from 'react';
import { api } from '../../lib/api';
import styles from './Friends.module.css';

interface Friend {
  id: string;
  username: string;
  discriminator: string;
  avatar: string | null;
  status?: string;
}

export const Friends: React.FC = () => {
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pending, setPending] = useState<Friend[]>([]);
  const [blocked, _setBlocked] = useState<Friend[]>([]);
  const [activeTab, setActiveTab] = useState<'online' | 'all' | 'pending' | 'blocked'>('online');
  const [addFriendInput, setAddFriendInput] = useState('');

  useEffect(() => {
    loadFriends();
    loadPending();
  }, []);

  const loadFriends = async () => {
    try {
      const { data } = await api.get('/friends');
      setFriends(data);
    } catch (error) {
      console.error('Failed to load friends:', error);
    }
  };

  const loadPending = async () => {
    try {
      const { data } = await api.get('/friends/pending');
      setPending(data);
    } catch (error) {
      console.error('Failed to load pending:', error);
    }
  };

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const match = addFriendInput.match(/^(.+)#(\d{4})$/);
    if (!match) {
      alert('Please use format: Username#1234');
      return;
    }

    const [, username, discriminator] = match;

    try {
      await api.post('/friends/request', { username, discriminator });
      setAddFriendInput('');
      alert('Friend request sent!');
    } catch (error: any) {
      alert(error.message || 'Failed to send friend request');
    }
  };

  const handleAcceptRequest = async (friendId: string) => {
    try {
      await api.put(`/friends/${friendId}/accept`);
      loadFriends();
      loadPending();
    } catch (error) {
      console.error('Failed to accept request:', error);
    }
  };

  const handleRemoveFriend = async (friendId: string) => {
    if (!confirm('Remove this friend?')) return;

    try {
      await api.delete(`/friends/${friendId}`);
      setFriends(friends.filter(f => f.id !== friendId));
    } catch (error) {
      console.error('Failed to remove friend:', error);
    }
  };

  const handleBlockUser = async (userId: string) => {
    if (!confirm('Block this user?')) return;

    try {
      await api.post('/users/@me/block', { blockedUserId: userId });
      setFriends(friends.filter(f => f.id !== userId));
      loadFriends();
    } catch (error) {
      console.error('Failed to block user:', error);
    }
  };

  const displayedFriends = activeTab === 'pending' ? pending : 
                           activeTab === 'blocked' ? blocked :
                           activeTab === 'online' ? friends.filter(f => f.status === 'online') :
                           friends;

  return (
    <div className={styles.friendsContainer}>
      <div className={styles.header}>
        <nav className={styles.tabs}>
          <button 
            className={activeTab === 'online' ? styles.active : ''}
            onClick={() => setActiveTab('online')}
          >
            Online
          </button>
          <button 
            className={activeTab === 'all' ? styles.active : ''}
            onClick={() => setActiveTab('all')}
          >
            All
          </button>
          <button 
            className={activeTab === 'pending' ? styles.active : ''}
            onClick={() => setActiveTab('pending')}
          >
            Pending {pending.length > 0 && <span className={styles.badge}>{pending.length}</span>}
          </button>
          <button 
            className={activeTab === 'blocked' ? styles.active : ''}
            onClick={() => setActiveTab('blocked')}
          >
            Blocked
          </button>
        </nav>

        <form className={styles.addFriend} onSubmit={handleAddFriend}>
          <input
            type="text"
            placeholder="Add Friend (Username#1234)"
            value={addFriendInput}
            onChange={(e) => setAddFriendInput(e.target.value)}
          />
          <button type="submit">Add</button>
        </form>
      </div>

      <div className={styles.friendsList}>
        {activeTab === 'pending' && pending.length > 0 && (
          <div className={styles.section}>
            <h3>Pending Requests</h3>
            {pending.map(user => (
              <div key={user.id} className={styles.friendItem}>
                <div className={styles.avatar}>
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.username} />
                  ) : (
                    <div className={styles.defaultAvatar}>
                      {user.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div className={styles.info}>
                  <div className={styles.username}>
                    {user.username}<span className={styles.discriminator}>#{user.discriminator}</span>
                  </div>
                </div>
                <div className={styles.actions}>
                  <button 
                    className={styles.acceptBtn}
                    onClick={() => handleAcceptRequest(user.id)}
                  >
                    Accept
                  </button>
                  <button 
                    className={styles.rejectBtn}
                    onClick={() => handleRemoveFriend(user.id)}
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {displayedFriends.length === 0 ? (
          <div className={styles.empty}>
            <p>No friends to display</p>
          </div>
        ) : (
          displayedFriends.map(friend => (
            <div key={friend.id} className={styles.friendItem}>
              <div className={styles.avatar}>
                {friend.avatar ? (
                  <img src={friend.avatar} alt={friend.username} />
                ) : (
                  <div className={styles.defaultAvatar}>
                    {friend.username[0].toUpperCase()}
                  </div>
                )}
                {friend.status && (
                  <div className={`${styles.status} ${styles[friend.status]}`} />
                )}
              </div>
              <div className={styles.info}>
                <div className={styles.username}>
                  {friend.username}<span className={styles.discriminator}>#{friend.discriminator}</span>
                </div>
                {friend.status && (
                  <div className={styles.statusText}>{friend.status}</div>
                )}
              </div>
              <div className={styles.actions}>
                <button 
                  className={styles.messageBtn}
                  title="Message"
                >
                  💬
                </button>
                <button 
                  className={styles.blockBtn}
                  title="Block"
                  onClick={() => handleBlockUser(friend.id)}
                >
                  🚫
                </button>
                <button 
                  className={styles.moreBtn}
                  title="More"
                >
                  ⋯
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
