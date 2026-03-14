/**
 * WebhookClient — Send messages to Beacon webhooks without a bot token.
 * Also supports editing and deleting webhook messages.
 */

import { EmbedBuilder } from '../builders/EmbedBuilder';
import type { ActionRowData } from '../builders/ActionRowBuilder';

export interface WebhookMessageOptions {
  content?: string;
  username?: string;
  avatarURL?: string;
  embeds?: ReturnType<EmbedBuilder['toJSON']>[];
  components?: ActionRowData[];
  /** Suppresses @everyone and @here mentions */
  allowedMentions?: {
    parse?: Array<'everyone' | 'roles' | 'users'>;
    roles?: string[];
    users?: string[];
  };
}

export interface WebhookClientOptions {
  /** Full webhook URL (preferred) */
  url?: string;
  /** Webhook ID (use with token) */
  id?: string;
  /** Webhook token (use with id) */
  token?: string;
  baseURL?: string;
}

export class WebhookClient {
  private url: string;

  constructor(options: WebhookClientOptions) {
    if (options.url) {
      this.url = options.url.replace(/\/$/, '');
    } else if (options.id && options.token) {
      const base = (options.baseURL ?? 'https://api.beacon.qzz.io/v1').replace(/\/$/, '');
      this.url = `${base}/webhooks/${options.id}/${options.token}`;
    } else {
      throw new Error('WebhookClient requires either a url or both id + token');
    }
  }

  /** Send a message via the webhook. Returns the sent message ID. */
  async send(options: WebhookMessageOptions | string): Promise<string> {
    const body = typeof options === 'string' ? { content: options } : options;
    const res = await this._request('POST', '', body);
    return res?.id ?? '';
  }

  /** Edit a previously sent webhook message by its ID. */
  async edit(messageId: string, options: WebhookMessageOptions | string): Promise<void> {
    const body = typeof options === 'string' ? { content: options } : options;
    await this._request('PATCH', `/messages/${messageId}`, body);
  }

  /** Delete a previously sent webhook message by its ID. */
  async delete(messageId: string): Promise<void> {
    await this._request('DELETE', `/messages/${messageId}`);
  }

  /** Fetch metadata about this webhook. */
  async fetchInfo(): Promise<any> {
    return this._request('GET', '');
  }

  private async _request(method: string, path: string, body?: any): Promise<any> {
    const url = `${this.url}${path}`;
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : {},
      body: body ? JSON.stringify(body) : undefined,
    });

    if (res.status === 204) return null;

    if (!res.ok) {
      const err = await res.json().catch(() => ({ message: res.statusText }));
      throw Object.assign(new Error(`Webhook HTTP ${res.status}: ${err.message}`), {
        status: res.status,
        response: err,
      });
    }

    return res.json();
  }
}
