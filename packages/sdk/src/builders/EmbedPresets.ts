/**
 * EmbedPresets — Ready-made embed factories for common patterns.
 * Reduces boilerplate for success/error/info/warning messages.
 */

import { EmbedBuilder } from './EmbedBuilder';

export class EmbedPresets {
  /** Green success color */
  static success(title: string, description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(title);
    if (description) e.setDescription(description);
    return e;
  }

  /** Red error color */
  static error(title: string, description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle(title);
    if (description) e.setDescription(description);
    return e;
  }

  /** Yellow warning color */
  static warning(title: string, description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle(title);
    if (description) e.setDescription(description);
    return e;
  }

  /** Blue info color */
  static info(title: string, description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(title);
    if (description) e.setDescription(description);
    return e;
  }

  /** Build a profile card embed from a user object */
  static profileCard(opts: {
    username: string;
    avatarURL?: string;
    description?: string;
    fields?: { name: string; value: string; inline?: boolean }[];
    color?: number;
    footerText?: string;
  }): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(opts.color ?? 0x5865f2)
      .setAuthor(opts.username, undefined, opts.avatarURL);
    if (opts.description) e.setDescription(opts.description);
    if (opts.fields?.length) {
      e.addFields(opts.fields as any);
    }
    if (opts.footerText) e.setFooter(opts.footerText);
    return e;
  }
}
