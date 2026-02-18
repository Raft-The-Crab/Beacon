/**
 * Stage Channel Component - Voice channels with speaker/listener modes
 */

import React, { useState } from 'react';
import styles from './StageChannel.module.css';

interface StageMember {
  id: string;
  username: string;
  avatar: string | null;
  role: 'speaker' | 'listener' | 'moderator';
  speaking: boolean;
  muted: boolean;
}

export const StageChannel: React.FC<{ channelId: string }> = ({ channelId: _channelId }) => {
  const [members, setMembers] = useState<StageMember[]>([]);
  const [topic, setTopic] = useState('Welcome to the stage!');
  const [isEditingTopic, setIsEditingTopic] = useState(false);
  const [requestedToSpeak, setRequestedToSpeak] = useState(false);

  const speakers = members.filter(m => m.role === 'speaker' || m.role === 'moderator');
  const listeners = members.filter(m => m.role === 'listener');

  const handleRequestToSpeak = () => {
    setRequestedToSpeak(true);
    // TODO: Send request to moderators
  };

  const handlePromoteToSpeaker = (memberId: string) => {
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, role: 'speaker' } : m
    ));
  };

  const handleDemoteToListener = (memberId: string) => {
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, role: 'listener' } : m
    ));
  };

  const handleMuteMember = (memberId: string) => {
    setMembers(members.map(m => 
      m.id === memberId ? { ...m, muted: !m.muted } : m
    ));
  };

  return (
    <div className={styles.stageChannel}>
      <div className={styles.header}>
        <div className={styles.stageIcon}>🎙️</div>
        <div className={styles.topicSection}>
          {isEditingTopic ? (
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onBlur={() => setIsEditingTopic(false)}
              autoFocus
              className={styles.topicInput}
            />
          ) : (
            <div className={styles.topic} onClick={() => setIsEditingTopic(true)}>
              {topic}
            </div>
          )}
        </div>
      </div>

      <div className={styles.stage}>
        <div className={styles.section}>
          <h3>Speakers — {speakers.length}</h3>
          <div className={styles.memberGrid}>
            {speakers.length === 0 ? (
              <div className={styles.emptyState}>
                <p>No speakers yet</p>
              </div>
            ) : (
              speakers.map(member => (
                <div key={member.id} className={styles.speakerCard}>
                  <div className={styles.avatar}>
                    {member.avatar ? (
                      <img src={member.avatar} alt={member.username} />
                    ) : (
                      <div className={styles.defaultAvatar}>
                        {member.username[0].toUpperCase()}
                      </div>
                    )}
                    {member.speaking && <div className={styles.speakingRing} />}
                  </div>
                  <div className={styles.memberName}>{member.username}</div>
                  {member.role === 'moderator' && (
                    <div className={styles.modBadge}>🛡️</div>
                  )}
                  {member.muted && <div className={styles.mutedBadge}>🔇</div>}
                  
                  <div className={styles.memberActions}>
                    <button onClick={() => handleMuteMember(member.id)}>
                      {member.muted ? '🔊' : '🔇'}
                    </button>
                    {member.role !== 'moderator' && (
                      <button onClick={() => handleDemoteToListener(member.id)}>
                        ⬇️
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className={styles.section}>
          <h3>Listeners — {listeners.length}</h3>
          <div className={styles.listenerList}>
            {listeners.map(member => (
              <div key={member.id} className={styles.listenerItem}>
                <div className={styles.avatar}>
                  {member.avatar ? (
                    <img src={member.avatar} alt={member.username} />
                  ) : (
                    <div className={styles.defaultAvatar}>
                      {member.username[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <span className={styles.memberName}>{member.username}</span>
                <button 
                  className={styles.promoteBtn}
                  onClick={() => handlePromoteToSpeaker(member.id)}
                >
                  Invite to Speak
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={styles.controls}>
        {!requestedToSpeak ? (
          <button className={styles.requestBtn} onClick={handleRequestToSpeak}>
            ✋ Request to Speak
          </button>
        ) : (
          <button className={styles.requestBtn} disabled>
            ⏳ Request Pending
          </button>
        )}
        <button className={styles.leaveBtn}>
          Leave Stage
        </button>
      </div>
    </div>
  );
};
