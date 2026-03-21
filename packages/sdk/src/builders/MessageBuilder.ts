import { EmbedBuilder } from './EmbedBuilder';
import { ActionRowBuilder } from './ActionRowBuilder';
import type { Embed } from '../types/index';

/**
 * High-level builder for constructing Beacon messages.
 * Simplifies creating complex messages with content, embeds, and interactive components.
 */
export class MessageBuilder {
  private content: string = '';
  private embeds: any[] = [];
  private components: any[] = [];
  private tts: boolean = false;
  private flags: number = 0;

  /**
   * Sets the text content of the message.
   */
  setContent(content: string): this {
    this.content = content;
    return this;
  }

  /**
   * Adds an embed to the message.
   */
  addEmbed(embed: EmbedBuilder | Embed | ((builder: EmbedBuilder) => EmbedBuilder)): this {
    if (this.embeds.length >= 10) {
      throw new Error('MessageBuilder: Maximum of 10 embeds per message.');
    }

    if (typeof embed === 'function') {
      const builder = new EmbedBuilder();
      this.embeds.push(embed(builder).toJSON());
    } else if (embed instanceof EmbedBuilder) {
      this.embeds.push(embed.toJSON());
    } else {
      this.embeds.push(embed);
    }
    return this;
  }

  /**
   * Adds multiple embeds to the message.
   */
  addEmbeds(...embeds: (EmbedBuilder | Embed)[]): this {
    embeds.forEach(e => this.addEmbed(e));
    return this;
  }

  /**
   * Adds an action row of components to the message.
   */
  addRow(row: ActionRowBuilder | any | ((builder: ActionRowBuilder) => ActionRowBuilder)): this {
    if (this.components.length >= 5) {
      throw new Error('MessageBuilder: Maximum of 5 action rows per message.');
    }

    if (typeof row === 'function') {
      const builder = new ActionRowBuilder();
      this.components.push(row(builder).toJSON());
    } else if (row instanceof ActionRowBuilder) {
      this.components.push(row.toJSON());
    } else {
      this.components.push(row);
    }
    return this;
  }

  /**
   * Sets whether the message should be read aloud via text-to-speech.
   */
  setTTS(tts: boolean): this {
    this.tts = tts;
    return this;
  }

  /**
   * Sets message flags (e.g., 64 for EPHEMERAL).
   */
  setFlags(flags: number): this {
    this.flags = flags;
    return this;
  }

  /**
   * Shortcut to set the EPHEMERAL flag.
   */
  setEphemeral(ephemeral: boolean = true): this {
    if (ephemeral) {
      this.flags |= 64;
    } else {
      this.flags &= ~64;
    }
    return this;
  }

  /**
   * Converts the builder to a plain JSON object for the API.
   */
  toJSON() {
    return {
      content: this.content,
      embeds: this.embeds,
      components: this.components,
      tts: this.tts,
      flags: this.flags
    };
  }

  /**
   * Alias for build() to match other builders.
   */
  build() {
    return this.toJSON();
  }
}
