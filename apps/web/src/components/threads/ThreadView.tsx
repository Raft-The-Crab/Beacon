/**
 * Thread Management Component
 */

import React, { useState } from 'react';
import styles from './ThreadView.module.css';

interface Thread {
  id: string;
  name: string;
  messageId: string;
  archived: boolean;
  locked: boolean;
  autoArchiveDuration: number;
  archiveTimestamp: string | null;
  messageCount: number;
  memberCount: number;
}

export const ThreadView: React.FC<{ channelId: string }> = ({ channelId: _channelId }) => {
  const [_threads, _setThreads] = useState<Thread[]>([]);
  const [activeThreads, setActiveThreads] = useState<Thread[]>([]);
  const [archivedThreads, setArchivedThreads] = useState<Thread[]>([]);
  const [showArchived, setShowArchived] = useState(false);

  const createThread = async (name: string, messageId: string) => {
    // TODO: API call
    const thread: Thread = {
      id: Date.now().toString(),
      name,
      messageId,
      archived: false,
      locked: false,
      autoArchiveDuration: 1440, // 24 hours
      archiveTimestamp: null,
      messageCount: 0,
      memberCount: 1
    };

    setActiveThreads([...activeThreads, thread]);
  };

  const archiveThread = async (threadId: string) => {
    const thread = activeThreads.find(t => t.id === threadId);
    if (!thread) return;

    const archived = { ...thread, archived: true, archiveTimestamp: new Date().toISOString() };
    setActiveThreads(activeThreads.filter(t => t.id !== threadId));
    setArchivedThreads([...archivedThreads, archived]);
  };

  const unarchiveThread = async (threadId: string) => {
    const thread = archivedThreads.find(t => t.id === threadId);
    if (!thread) return;

    const unarchived = { ...thread, archived: false, archiveTimestamp: null };
    setArchivedThreads(archivedThreads.filter(t => t.id !== threadId));
    setActiveThreads([...activeThreads, unarchived]);
  };

  const displayedThreads = showArchived ? archivedThreads : activeThreads;

  return (
    <div className={styles.threadView}>
      <div className={styles.header}>
        <h2>Threads</h2>
        <div className={styles.tabs}>
          <button
            className={!showArchived ? styles.active : ''}
            onClick={() => setShowArchived(false)}
          >
            Active ({activeThreads.length})
          </button>
          <button
            className={showArchived ? styles.active : ''}
            onClick={() => setShowArchived(true)}
          >
            Archived ({archivedThreads.length})
          </button>
          <button 
            className={styles.newThreadBtn}
            onClick={() => createThread('New Thread', '0')}
          >
            + New Thread
          </button>
        </div>
      </div>

      <div className={styles.threadList}>
        {displayedThreads.length === 0 ? (
          <div className={styles.emptyState}>
            <p>No {showArchived ? 'archived' : 'active'} threads</p>
          </div>
        ) : (
          displayedThreads.map(thread => (
            <div key={thread.id} className={styles.threadItem}>
              <div className={styles.threadIcon}>🧵</div>
              <div className={styles.threadInfo}>
                <div className={styles.threadName}>{thread.name}</div>
                <div className={styles.threadMeta}>
                  <span>{thread.messageCount} messages</span>
                  <span>•</span>
                  <span>{thread.memberCount} members</span>
                  {thread.archived && thread.archiveTimestamp && (
                    <>
                      <span>•</span>
                      <span>Archived {new Date(thread.archiveTimestamp).toLocaleDateString()}</span>
                    </>
                  )}
                </div>
              </div>
              <div className={styles.threadActions}>
                {thread.archived ? (
                  <button onClick={() => unarchiveThread(thread.id)}>Unarchive</button>
                ) : (
                  <button onClick={() => archiveThread(thread.id)}>Archive</button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
