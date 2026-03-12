import { useEffect, useRef, useState } from 'react'

export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(handler)
  }, [value, delay])

  return debouncedValue
}

export function useThrottle<T>(value: T, limit: number): T {
  const [throttledValue, setThrottledValue] = useState<T>(value)
  const lastRun = useRef(Date.now())

  useEffect(() => {
    const elapsed = Date.now() - lastRun.current
    if (elapsed >= limit) {
      setThrottledValue(value)
      lastRun.current = Date.now()
      return
    }

    const timeout = setTimeout(() => {
      setThrottledValue(value)
      lastRun.current = Date.now()
    }, limit - elapsed)

    return () => clearTimeout(timeout)
  }, [value, limit])

  return throttledValue
}

export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T | undefined>(undefined)

  useEffect(() => {
    ref.current = value
  }, [value])

  return ref.current
}

export function useVisibilityChange(onVisible?: () => void, onHidden?: () => void): boolean {
  const [isVisible, setIsVisible] = useState(!document.hidden)

  useEffect(() => {
    const handler = () => {
      const visible = !document.hidden
      setIsVisible(visible)
      if (visible) {
        onVisible?.()
      } else {
        onHidden?.()
      }
    }

    document.addEventListener('visibilitychange', handler)
    return () => document.removeEventListener('visibilitychange', handler)
  }, [onVisible, onHidden])

  return isVisible
}
