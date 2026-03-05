/**
 * Typing Indicator Component
 */

import React from 'react';
import styles from '../../styles/modules/typing/TypingIndicator.module.css';
import { useVoiceStore } from '../../stores/useVoiceStore';
import { useServerStore } from '../../stores/useServerStore';

export const TypingIndicator: React.FC<{ channelId?: string }> = () => {
  const typingUsersSet = useVoiceStore((state) => state.typingUsers);
  const typingUserIds = Array.from(typingUsersSet);
  const currentServer = useServerStore(state => state.currentServer);

  if (typingUserIds.length === 0) return <div className={styles.typingIndicator} style={{ opacity: 0, pointerEvents: 'none' }} />;

  const getTypingText = () => {
    const names = typingUserIds.map(id => {
      if (id === 'current-user') return 'You';
      const member = currentServer?.members?.find((m: any) => m.userId === id);
      return member?.username || id;
    });

    if (names.length === 1) {
      return `${names[0]} ${names[0] === 'You' ? 'are' : 'is'} typing...`;
    } else if (names.length === 2) {
      return `${names[0]} and ${names[1]} are typing...`;
    } else if (names.length === 3) {
      return `${names[0]}, ${names[1]}, and ${names[2]} are typing...`;
    } else {
      return 'Several people are typing...';
    }
  };

  return (
    <div className={styles.typingIndicator}>
      <div className={styles.dots}>
        <span></span>
        <span></span>
        <span></span>
      </div>
      <span className={styles.text}>{getTypingText()}</span>
    </div>
  );
};

