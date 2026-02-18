/**
 * VoiceControls - UI component for voice channel controls
 */

import React from 'react';
import { useVoiceStore } from '../../stores/useVoiceStore';
import { voiceManager } from '../../services/voiceManager';
import styles from './VoiceControls.module.css';

export const VoiceControls: React.FC = () => {
  const currentVoiceState = useVoiceStore(state => state.currentVoiceState);
  const setSelfMute = useVoiceStore(state => state.setSelfMute);
  const setSelfDeaf = useVoiceStore(state => state.setSelfDeaf);
  const setSelfVideo = useVoiceStore(state => state.setSelfVideo);
  const voiceUsers = useVoiceStore(state => state.voiceUsers);

  if (!currentVoiceState) return null;

  const handleToggleMute = () => {
    const newMuted = !currentVoiceState.selfMute;
    setSelfMute(newMuted);
    voiceManager.setMute(currentVoiceState.guildId, newMuted);
  };

  const handleToggleDeaf = () => {
    const newDeafened = !currentVoiceState.selfDeaf;
    setSelfDeaf(newDeafened);
    voiceManager.setDeaf(currentVoiceState.guildId, newDeafened);
  };

  const handleToggleVideo = () => {
    const newVideo = !currentVoiceState.selfVideo;
    setSelfVideo(newVideo);
    voiceManager.setVideo(currentVoiceState.guildId, newVideo);
  };

  const handleScreenShare = async () => {
    try {
      await voiceManager.startScreenShare(currentVoiceState.guildId);
    } catch (error) {
      console.error('Screen share failed:', error);
    }
  };

  const handleDisconnect = async () => {
    await voiceManager.leaveChannel(currentVoiceState.guildId);
  };

  return (
    <div className={styles.voiceControls}>
      <div className={styles.connectedInfo}>
        <div className={styles.indicator} />
        <span>Voice Connected</span>
      </div>

      <div className={styles.userList}>
        {Array.from(voiceUsers.values()).map(user => (
          <div key={user.userId} className={styles.voiceUser}>
            <div className={styles.avatar} />
            <span className={styles.username}>User {user.userId}</span>
            {user.speaking && <div className={styles.speakingIndicator} />}
            {user.selfMute && <span className={styles.mutedIcon}>🔇</span>}
            {user.selfVideo && <span className={styles.videoIcon}>📹</span>}
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${currentVoiceState.selfMute ? styles.active : ''}`}
          onClick={handleToggleMute}
          title={currentVoiceState.selfMute ? 'Unmute' : 'Mute'}
        >
          {currentVoiceState.selfMute ? '🔇' : '🔊'}
        </button>

        <button
          className={`${styles.controlBtn} ${currentVoiceState.selfDeaf ? styles.active : ''}`}
          onClick={handleToggleDeaf}
          title={currentVoiceState.selfDeaf ? 'Undeafen' : 'Deafen'}
        >
          {currentVoiceState.selfDeaf ? '🔕' : '🔔'}
        </button>

        <button
          className={`${styles.controlBtn} ${currentVoiceState.selfVideo ? styles.active : ''}`}
          onClick={handleToggleVideo}
          title={currentVoiceState.selfVideo ? 'Stop Video' : 'Start Video'}
        >
          {currentVoiceState.selfVideo ? '📹' : '📷'}
        </button>

        <button
          className={styles.controlBtn}
          onClick={handleScreenShare}
          title="Share Screen"
        >
          🖥️
        </button>

        <button
          className={`${styles.controlBtn} ${styles.disconnect}`}
          onClick={handleDisconnect}
          title="Disconnect"
        >
          📞
        </button>
      </div>
    </div>
  );
};
