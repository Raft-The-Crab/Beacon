/**
 * BeaconEventEmitter - Type-safe event system for bots
 */

export interface BeaconEvents {
  ready: [];
  messageCreate: [message: any];
  messageUpdate: [oldMessage: any, newMessage: any];
  messageDelete: [message: any];
  guildCreate: [guild: any];
  guildDelete: [guild: any];
  guildMemberAdd: [member: any];
  guildMemberRemove: [member: any];
  channelCreate: [channel: any];
  channelDelete: [channel: any];
  voiceStateUpdate: [oldState: any, newState: any];
  interactionCreate: [interaction: any];
  error: [error: Error];
  debug: [message: string];
}

type EventListener<T extends any[]> = (...args: T) => void | Promise<void>;

export class BeaconEventEmitter {
  private listeners: Map<keyof BeaconEvents, Set<EventListener<any>>> = new Map();

  on<K extends keyof BeaconEvents>(event: K, listener: EventListener<BeaconEvents[K]>): this {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(listener);
    return this;
  }

  once<K extends keyof BeaconEvents>(event: K, listener: EventListener<BeaconEvents[K]>): this {
    const wrappedListener: EventListener<BeaconEvents[K]> = ((...args: any[]) => {
      this.off(event, wrappedListener);
      (listener as any)(...args);
    }) as EventListener<BeaconEvents[K]>;
    
    return this.on(event, wrappedListener);
  }

  off<K extends keyof BeaconEvents>(event: K, listener: EventListener<BeaconEvents[K]>): this {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener as any);
    }
    return this;
  }

  emit<K extends keyof BeaconEvents>(event: K, ...args: BeaconEvents[K]): boolean {
    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      return false;
    }

    for (const listener of eventListeners) {
      try {
        (listener as any)(...args);
      } catch (error) {
        console.error(`Error in ${event} listener:`, error);
        if (event !== 'error') {
          this.emit('error', error as Error);
        }
      }
    }

    return true;
  }

  removeAllListeners(event?: keyof BeaconEvents): this {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
    return this;
  }

  listenerCount(event: keyof BeaconEvents): number {
    return this.listeners.get(event)?.size ?? 0;
  }
}
