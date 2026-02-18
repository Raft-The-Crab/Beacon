/**
 * Typing Indicator Component
 */

import React, { useEffect, useState } from 'react';
import styles from './TypingIndicator.module.css';

interface TypingUser {
  id: string;
  username: string;
}

export const TypingIndicator: React.FC<{ channelId: string }> = ({ channelId }) => {
  const [typingUsers, _setTypingUsers] = useState<TypingUser[]>([]);

  useEffect(() => {
    // Listen for typing events from WebSocket
    // TODO: Implement WebSocket typing events
    
    const interval = setInterval(() => {
      // Clean up stale typing indicators (older than 10 seconds)
      // Implementation depends on your typing state management
    }, 1000);

    return () => clearInterval(interval);
  }, [channelId]);

  if (typingUsers.length === 0) return null;

  const getTypingText = () => {
    if (typingUsers.length === 1) {
      return `${typingUsers[0].username} is typing...`;
    } else if (typingUsers.length === 2) {
      return `${typingUsers[0].username} and ${typingUsers[1].username} are typing...`;
    } else if (typingUsers.length === 3) {
      return `${typingUsers[0].username}, ${typingUsers[1].username}, and ${typingUsers[2].username} are typing...`;
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

// Hook to send typing events
export const useTyping = (_channelId: string) => {
  const [isTyping, setIsTyping] = useState(false);
  const [timeout, setTimeoutState] = useState<NodeJS.Timeout | null>(null);

  const sendTyping = () => {
    if (!isTyping) {
      // TODO: Send typing start event via WebSocket
      setIsTyping(true);
    }

    // Clear existing timeout
    if (timeout) {
      clearTimeout(timeout);
    }

    // Set timeout to stop typing after 10 seconds
    const newTimeout = setTimeout(() => {
      // TODO: Send typing stop event via WebSocket
      setIsTyping(false);
    }, 10000);

    setTimeoutState(newTimeout);
  };

  const stopTyping = () => {
    if (timeout) {
      clearTimeout(timeout);
    }
    if (isTyping) {
      // TODO: Send typing stop event via WebSocket
      setIsTyping(false);
    }
  };

  useEffect(() => {
    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [timeout]);

  return { sendTyping, stopTyping };
};
