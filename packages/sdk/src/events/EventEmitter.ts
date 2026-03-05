import type { SDKEventMap } from '../types'

type GenericListener = (payload?: unknown) => void

export class BeaconEventEmitter {
  private listeners = new Map<keyof SDKEventMap, Set<GenericListener>>()

  emit<K extends keyof SDKEventMap>(event: K, ...args: SDKEventMap[K] extends void ? [] : [SDKEventMap[K]]): boolean {
    const eventListeners = this.listeners.get(event)
    if (!eventListeners || eventListeners.size === 0) {
      return false
    }

    const payload = args[0] as SDKEventMap[K]
    for (const listener of eventListeners) {
      listener(payload)
    }
    return true
  }

  on<K extends keyof SDKEventMap>(
    event: K,
    listener: SDKEventMap[K] extends void ? () => void : (data: SDKEventMap[K]) => void
  ): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(listener as GenericListener)
    return this
  }

  once<K extends keyof SDKEventMap>(
    event: K,
    listener: SDKEventMap[K] extends void ? () => void : (data: SDKEventMap[K]) => void
  ): this {
    const wrapped = ((data?: unknown) => {
      this.off(event, wrapped as any)
      ;(listener as any)(data)
    })

    return this.on(event, wrapped as any)
  }

  off<K extends keyof SDKEventMap>(
    event: K,
    listener: SDKEventMap[K] extends void ? () => void : (data: SDKEventMap[K]) => void
  ): this {
    this.listeners.get(event)?.delete(listener as GenericListener)
    return this
  }

  removeAllListeners(event?: keyof SDKEventMap): this {
    if (event) {
      this.listeners.get(event)?.clear()
      return this
    }

    for (const key of this.listeners.keys()) {
      this.listeners.get(key)?.clear()
    }
    return this
  }
}
