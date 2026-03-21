import type { Client } from '../client';

export type ScheduledEventStatus = 'SCHEDULED' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';
export type ScheduledEventEntityType = 'STAGE_INSTANCE' | 'VOICE' | 'EXTERNAL';

export class ScheduledEvent {
  public id: string;
  public guildId: string;
  public channelId: string | null;
  public name: string;
  public description: string | null;
  public scheduledStartTime: Date;
  public scheduledEndTime: Date | null;
  public status: ScheduledEventStatus;
  public entityType: ScheduledEventEntityType;
  public entityMetadata: { location?: string } | null;
  public creatorId: string | null;
  public userCount: number;

  constructor(public readonly client: Client, data: any) {
    this.id = data.id;
    this.guildId = data.guildId || data.guild_id;
    this.channelId = data.channelId || data.channel_id || null;
    this.name = data.name;
    this.description = data.description || null;
    this.scheduledStartTime = new Date(data.scheduledStartTime || data.scheduled_start_time);
    this.scheduledEndTime = (data.scheduledEndTime || data.scheduled_end_time) ? new Date(data.scheduledEndTime || data.scheduled_end_time) : null;
    this.status = data.status;
    this.entityType = data.entityType || data.entity_type;
    this.entityMetadata = data.entityMetadata || data.entity_metadata || null;
    this.creatorId = data.creatorId || data.creator_id || null;
    this.userCount = data.userCount || data.user_count || 0;
  }

  async delete() {
    return this.client.rest.delete(`/guilds/${this.guildId}/scheduled-events/${this.id}`);
  }

  async edit(options: any) {
    return this.client.rest.patch(`/guilds/${this.guildId}/scheduled-events/${this.id}`, options);
  }
}
