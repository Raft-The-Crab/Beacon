
import { Client } from '../client';
import { ScheduledEvent } from '../structures/ScheduledEvent';

export class GuildScheduledEventManager {
  constructor(private client: Client, private guildId: string) {}

  /** Fetch all scheduled events for a guild */
  async list(): Promise<ScheduledEvent[]> {
    const data = await this.client.rest.get(`/guilds/${this.guildId}/scheduled-events`);
    return (data || []).map((e: any) => new ScheduledEvent(this.client, e));
  }

  /** Fetch a specific scheduled event */
  async fetch(eventId: string): Promise<ScheduledEvent> {
    const data = await this.client.rest.get(`/guilds/${this.guildId}/scheduled-events/${eventId}`);
    return new ScheduledEvent(this.client, data);
  }

  /** Create a new scheduled event */
  async create(options: {
    name: string;
    scheduledStartTime: Date;
    channelId?: string;
    description?: string;
    entityType: 'STAGE_INSTANCE' | 'VOICE' | 'EXTERNAL';
    entityMetadata?: { location?: string };
  }): Promise<ScheduledEvent> {
    const data = await this.client.rest.post(`/guilds/${this.guildId}/scheduled-events`, {
      name: options.name,
      scheduled_start_time: options.scheduledStartTime.toISOString(),
      channel_id: options.channelId,
      description: options.description,
      entity_type: options.entityType,
      entity_metadata: options.entityMetadata
    });
    return new ScheduledEvent(this.client, data);
  }
}
