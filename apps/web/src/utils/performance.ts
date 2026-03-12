// Performance optimization utilities for React components

import { lazy, ComponentType, LazyExoticComponent } from 'react'

/**
 * Lazy load component with retry logic
 * Automatically retries failed chunk loads
 */
export function lazyWithRetry<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>,
  retriesLeft = 3,
  interval = 1000
): LazyExoticComponent<T> {
  const load = (): Promise<{ default: T }> =>
    factory().catch((error) => {
      if (retriesLeft <= 0) {
        throw error
      }

      retriesLeft -= 1
      return new Promise<{ default: T }>((resolve, reject) => {
        setTimeout(() => {
          load().then(resolve).catch(reject)
        }, interval)
      })
    })

  return lazy(load)
}

/**
 * Preload a lazy component
 * Useful for prefetching on hover or mount
 */
export function preloadComponent<T extends ComponentType<any>>(
  factory: () => Promise<{ default: T }>
): void {
  factory().catch(() => {
    // Silently fail - component will retry on actual load
  })
}

/**
 * Debounce function for performance-critical operations
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null
      func(...args)
    }
    
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

/**
 * Throttle function for scroll/resize handlers
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false
  
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args)
      inThrottle = true
      setTimeout(() => {
        inThrottle = false
      }, limit)
    }
  }
}

/**
 * Check if element is in viewport
 * For lazy loading images or components
 */
export function isInViewport(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}

/**
 * Request idle callback wrapper with fallback
 */
export function requestIdleCallback(
  callback: IdleRequestCallback,
  options?: IdleRequestOptions
): number {
  if ('requestIdleCallback' in window) {
    return window.requestIdleCallback(callback, options)
  }
  // Fallback to setTimeout
  return setTimeout(() => callback({ 
    didTimeout: false, 
    timeRemaining: () => 50 
  } as IdleDeadline), 1) as unknown as number
}

/**
 * Cancel idle callback with fallback
 */
export function cancelIdleCallback(id: number): void {
  if ('cancelIdleCallback' in window) {
    window.cancelIdleCallback(id)
  } else {
    clearTimeout(id)
  }
}

/**
 * Batch state updates for better performance
 */
export function batchedUpdates(updates: (() => void)[]): void {
  // In React 18+, updates are automatically batched
  // This is for backwards compatibility
  updates.forEach(update => update())
}

/**
 * Generate unique ID for keys
 * Faster than UUID for simple cases
 */
let idCounter = 0
export function generateId(prefix: string = 'id'): string {
  return `${prefix}-${Date.now()}-${++idCounter}`
}

/**
 * Shallow compare objects for memo/useMemo
 */
export function shallowEqual<T extends Record<string, any>>(
  obj1: T,
  obj2: T
): boolean {
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) {
    return false
  }
  
  return keys1.every(key => obj1[key] === obj2[key])
}

/**
 * Measure component render time
 */
export function measureRender(componentName: string) {
  if (import.meta.env.DEV) {
    const start = performance.now()
    
    return () => {
      const end = performance.now()
      console.log(`${componentName} rendered in ${(end - start).toFixed(2)}ms`)
    }
  }
  
  return () => {}
}

/**
 * Virtual scroll helper - calculate visible items
 */
export function calculateVisibleRange(
  scrollTop: number,
  containerHeight: number,
  itemHeight: number,
  totalItems: number,
  overscan: number = 3
): { start: number; end: number } {
  const start = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan)
  const visibleCount = Math.ceil(containerHeight / itemHeight)
  const end = Math.min(totalItems, start + visibleCount + overscan * 2)
  
  return { start, end }
}

/**
 * Image lazy loading with Intersection Observer
 */
export function lazyLoadImage(
  img: HTMLImageElement,
  src: string,
  options?: IntersectionObserverInit
): () => void {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        img.src = src
        observer.disconnect()
      }
    })
  }, options)
  
  observer.observe(img)
  
  return () => observer.disconnect()
}

/**
 * Prefetch resources
 */
export function prefetchResource(url: string, as: string = 'fetch'): void {
  const link = document.createElement('link')
  link.rel = 'prefetch'
  link.as = as
  link.href = url
  document.head.appendChild(link)
}

/**
 * Memory cleanup helper
 */
export function cleanup(...callbacks: (() => void)[]): () => void {
  return () => {
    callbacks.forEach(cb => {
      try {
        cb()
      } catch (error) {
        console.error('Cleanup error:', error)
      }
    })
  }
}
