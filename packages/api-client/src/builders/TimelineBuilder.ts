export interface TimelineEvent {
  title: string
  description?: string
  timestamp?: string | Date
  emoji?: string
  color?: string
}

export interface TimelineData {
  title?: string
  events: TimelineEvent[]
  compact?: boolean
}

/**
 * Renders a vertical timeline of events in a Beacon channel message.
 * Ideal for changelogs, schedules, and activity logs.
 *
 * @example
 * const timeline = new TimelineBuilder()
 *   .setTitle('Recent Updates')
 *   .addEvent({ title: 'v2.0 Released', description: 'Major overhaul shipped.', emoji: '🚀', timestamp: new Date() })
 *   .addEvent({ title: 'Beta launched', description: 'Public beta went live.', emoji: '🧪' })
 *   .build()
 */
export class TimelineBuilder {
  private data: TimelineData = { events: [] }

  setTitle(title: string): this {
    this.data.title = title
    return this
  }

  addEvent(event: TimelineEvent): this {
    if (this.data.events.length >= 20) {
      throw new Error('TimelineBuilder: Maximum of 20 events allowed.')
    }
    if (event.timestamp instanceof Date) {
      event.timestamp = event.timestamp.toISOString()
    }
    this.data.events.push(event)
    return this
  }

  addEvents(...events: TimelineEvent[]): this {
    events.forEach(e => this.addEvent(e))
    return this
  }

  setCompact(compact = true): this {
    this.data.compact = compact
    return this
  }

  build(): TimelineData {
    if (this.data.events.length === 0) throw new Error('TimelineBuilder: At least one event is required.')
    return { ...this.data, events: [...this.data.events] }
  }
}
