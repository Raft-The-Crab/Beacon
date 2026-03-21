import type { Embed } from '../types/index';

/**
 * Builder class for creating Beacon message embeds.
 * Matches and exceeds discord.js EmbedBuilder functionality.
 */
export class EmbedBuilder {
  private data: Embed = {};

  /**
   * Sets the author of the embed.
   */
  setAuthor(name: string, iconURL?: string, url?: string): this {
    this.data.author = { name, icon_url: iconURL, url };
    return this;
  }

  /**
   * Sets the title of the embed.
   */
  setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  /**
   * Sets the description of the embed.
   */
  setDescription(description: string): this {
    this.data.description = description;
    return this;
  }

  /**
   * Sets the color of the embed.
   * Can be a hex string (e.g., '#ff0000') or a number.
   */
  setColor(color: string | number): this {
    if (typeof color === 'string') {
      this.data.color = parseInt(color.replace('#', ''), 16);
    } else {
      this.data.color = color;
    }
    return this;
  }

  /**
   * Sets the image URL of the embed.
   */
  setImage(url: string): this {
    this.data.image = { url };
    return this;
  }

  /**
   * Sets the thumbnail URL of the embed.
   */
  setThumbnail(url: string): this {
    this.data.thumbnail = { url };
    return this;
  }

  /**
   * Sets the footer of the embed.
   */
  setFooter(text: string): this {
    this.data.footer = { text };
    return this;
  }

  /**
   * Sets the timestamp of the embed.
   * Defaults to now if no date is provided.
   */
  setTimestamp(timestamp: Date | string | number | null = new Date()): this {
    if (timestamp instanceof Date) {
      this.data.timestamp = timestamp.toISOString();
    } else if (typeof timestamp === 'string' || typeof timestamp === 'number') {
      this.data.timestamp = new Date(timestamp).toISOString();
    } else {
      this.data.timestamp = undefined;
    }
    return this;
  }

  /**
   * Adds a field to the embed.
   */
  addField(name: string, value: string, inline?: boolean): this {
    if (!this.data.fields) this.data.fields = [];
    this.data.fields.push({ name, value, inline });
    return this;
  }

  /**
   * Adds multiple fields to the embed.
   */
  addFields(fields: { name: string; value: string; inline?: boolean }[]): this {
    if (!this.data.fields) this.data.fields = [];
    this.data.fields.push(...fields);
    return this;
  }

  /**
   * Converts the builder to a plain JSON object.
   */
  toJSON(): Embed {
    return { ...this.data };
  }
}
