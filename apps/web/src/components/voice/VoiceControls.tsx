/**
 * VoiceControls - UI component for voice channel controls
 */

import React from 'react';
import { Mic, MicOff, Headphones, HeadphoneOff, Video, VideoOff, MonitorUp, PhoneOff } from 'lucide-react';
import { useVoiceStore } from '../../stores/useVoiceStore';
import { voiceManager } from '../../services/voiceManager';
import { useToast } from '../ui/Toast';
import styles from '../../styles/modules/voice/VoiceControls.module.css';

export const VoiceControls: React.FC = () => {
  const currentVoiceState = useVoiceStore(state => state.currentVoiceState);
  const setSelfMute = useVoiceStore(state => state.setSelfMute);
  const setSelfDeaf = useVoiceStore(state => state.setSelfDeaf);
  const setSelfVideo = useVoiceStore(state => state.setSelfVideo);
  const voiceUsers = useVoiceStore(state => state.voiceUsers);
  const { show } = useToast();

  if (!currentVoiceState) return null;

  const handleToggleMute = async () => {
    const newMuted = !currentVoiceState.selfMute;
    setSelfMute(newMuted);
    try {
      await voiceManager.setMute(currentVoiceState.guildId, newMuted);
    } catch (error) {
      setSelfMute(true);
      show(error instanceof Error ? error.message : 'Failed to change microphone state.', 'error');
    }
  };

  const handleToggleDeaf = () => {
    const newDeafened = !currentVoiceState.selfDeaf;
    setSelfDeaf(newDeafened);
    voiceManager.setDeaf(currentVoiceState.guildId, newDeafened);
  };

  const handleToggleVideo = async () => {
    const newVideo = !currentVoiceState.selfVideo;
    setSelfVideo(newVideo);
    try {
      await voiceManager.setVideo(currentVoiceState.guildId, newVideo);
    } catch (error) {
      setSelfVideo(false);
      show(error instanceof Error ? error.message : 'Failed to change camera state.', 'error');
    }
  };

  const handleScreenShare = async () => {
    try {
      await voiceManager.startScreenShare(currentVoiceState.guildId);
    } catch (error) {
      show(error instanceof Error ? error.message : 'Screen share failed.', 'error');
    }
  };

  const handleDisconnect = async () => {
    await voiceManager.leaveChannel();
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
            {user.selfMute && <MicOff size={14} className={styles.stateIcon} />}
            {user.selfVideo && <Video size={14} className={styles.stateIcon} />}
          </div>
        ))}
      </div>

      <div className={styles.controls}>
        <button
          className={`${styles.controlBtn} ${currentVoiceState.selfMute ? styles.active : ''}`}
          onClick={handleToggleMute}
          title={currentVoiceState.selfMute ? 'Unmute' : 'Mute'}
        >
          {currentVoiceState.selfMute ? <MicOff size={18} /> : <Mic size={18} />}
        </button>

        <button
          className={`${styles.controlBtn} ${currentVoiceState.selfDeaf ? styles.active : ''}`}
          onClick={handleToggleDeaf}
          title={currentVoiceState.selfDeaf ? 'Undeafen' : 'Deafen'}
        >
          {currentVoiceState.selfDeaf ? <HeadphoneOff size={18} /> : <Headphones size={18} />}
        </button>

        <button
          className={`${styles.controlBtn} ${currentVoiceState.selfVideo ? styles.active : ''}`}
          onClick={handleToggleVideo}
          title={currentVoiceState.selfVideo ? 'Stop Video' : 'Start Video'}
        >
          {currentVoiceState.selfVideo ? <Video size={18} /> : <VideoOff size={18} />}
        </button>

        <button
          className={styles.controlBtn}
          onClick={handleScreenShare}
          title="Share Screen"
        >
          <MonitorUp size={18} />
        </button>

        <button
          className={`${styles.controlBtn} ${styles.disconnect}`}
          onClick={handleDisconnect}
          title="Disconnect"
        >
          <PhoneOff size={18} />
        </button>
      </div>
    </div>
  );
};
