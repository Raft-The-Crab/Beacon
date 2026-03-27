import { EventEmitter } from 'eventemitter3';
import type { Client } from '../client';
import type { AuditLogEntry } from '../types/index';

export class AuditLogMonitor extends EventEmitter {
  private _interval: NodeJS.Timeout | null = null;
  private _lastEntryId: string | null = null;
  private _guilds = new Set<string>();

  constructor(private client: Client) {
    super();
  }

  /**
   * Start monitoring audit logs for a specific guild.
   */
  public watch(guildId: string) {
    this._guilds.add(guildId);
    if (!this._interval) {
      this._startPolling();
    }
  }

  /**
   * Stop monitoring audit logs for a specific guild.
   */
  public unwatch(guildId: string) {
    this._guilds.delete(guildId);
    if (this._guilds.size === 0 && this._interval) {
      clearInterval(this._interval);
      this._interval = null;
    }
  }

  private _startPolling() {
    this._interval = setInterval(() => this._poll(), 10000); // Poll every 10s
  }

  private async _poll() {
    for (const guildId of this._guilds) {
      try {
        const guild = await this.client.guilds.get(guildId);
        if (!guild) continue;

        // Fetch audit logs (limit 1 to find the latest)
        const logs = await this.client.rest.get<AuditLogEntry[]>(`/guilds/${guildId}/audit-logs?limit=1`);
        const latest = logs[0];

        if (latest && latest.id !== this._lastEntryId) {
          if (this._lastEntryId) {
            // Emit for all new entries (if we missed some, we might need more logic, but for now just the latest)
            this.emit('auditLogEntryCreate', latest, guildId);
            this.client.emit('auditLogEntryCreate', latest, guildId);
          }
          this._lastEntryId = latest.id;
        }
      } catch (err) {
        this.client.logger.debug(`[AuditLogMonitor] Failed to poll guild ${guildId}:`, err);
      }
    }
  }
}
