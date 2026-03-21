import { useEffect, useRef, useState, useCallback } from 'react'

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

// ─── v3: New Performance Hooks ───────────────────────────────────────────────

/**
 * v3: Observe element intersection with the viewport for lazy-loading.
 * Returns [ref, isIntersecting]. Attach `ref` to the target element.
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefCallback<Element>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const observerRef = useRef<IntersectionObserver | null>(null)

  const setRef = useCallback((node: Element | null) => {
    // Cleanup previous observer
    if (observerRef.current) {
      observerRef.current.disconnect()
      observerRef.current = null
    }

    if (!node) return

    observerRef.current = new IntersectionObserver(([entry]) => {
      setIsIntersecting(entry.isIntersecting)
    }, {
      threshold: 0.1,
      ...options,
    })

    observerRef.current.observe(node)
  }, [options.root, options.rootMargin, options.threshold])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      observerRef.current?.disconnect()
    }
  }, [])

  return [setRef, isIntersecting]
}

/**
 * v3: Reactive CSS media query hook.
 * @param query CSS media query string (e.g. '(max-width: 768px)')
 * @returns Whether the media query currently matches
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    const mql = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    // Set initial value
    setMatches(mql.matches)

    // Modern API
    mql.addEventListener('change', handler)
    return () => mql.removeEventListener('change', handler)
  }, [query])

  return matches
}

/**
 * v3: Detect network connectivity changes.
 * @returns Whether the browser is currently online
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const goOnline = () => setIsOnline(true)
    const goOffline = () => setIsOnline(false)

    window.addEventListener('online', goOnline)
    window.addEventListener('offline', goOffline)

    return () => {
      window.removeEventListener('online', goOnline)
      window.removeEventListener('offline', goOffline)
    }
  }, [])

  return isOnline
}
