import { useEffect, useRef, useCallback } from 'react'
import { wsClient } from '../services/websocket'

export function useTypingIndicator(channelId: string) {
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const isTypingRef = useRef(false)

  const startTyping = useCallback(() => {
    if (!isTypingRef.current) {
      wsClient.startTyping(channelId)
      isTypingRef.current = true
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
    }

    // Stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      if (isTypingRef.current) {
        wsClient.stopTyping(channelId)
        isTypingRef.current = false
      }
    }, 3000)
  }, [channelId])

  const stopTyping = useCallback(() => {
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = null
    }
    if (isTypingRef.current) {
      wsClient.stopTyping(channelId)
      isTypingRef.current = false
    }
  }, [channelId])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current)
      }
      if (isTypingRef.current) {
        wsClient.stopTyping(channelId)
      }
    }
  }, [channelId])

  return { startTyping, stopTyping }
}

// Debounce utility
export function useDebounce<T extends (...args: any[]) => any>(
  callback: T,
  delay: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)

  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    timeoutRef.current = setTimeout(() => {
      callback(...args)
    }, delay)
  }, [callback, delay])
}
