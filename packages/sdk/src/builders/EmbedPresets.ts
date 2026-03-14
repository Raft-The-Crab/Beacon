/**
 * EmbedPresets — Ready-made embed factories for common patterns.
 * Reduces boilerplate for success/error/info/warning messages.
 */

import { EmbedBuilder } from './EmbedBuilder';

export class EmbedPresets {
  /** ✅ Green success embed */
  static success(title: string, description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0x57f287)
      .setTitle(`✅ ${title}`);
    if (description) e.setDescription(description);
    return e;
  }

  /** ❌ Red error embed */
  static error(title: string, description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0xed4245)
      .setTitle(`❌ ${title}`);
    if (description) e.setDescription(description);
    return e;
  }

  /** ⚠️ Yellow warning embed */
  static warning(title: string, description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0xfee75c)
      .setTitle(`⚠️ ${title}`);
    if (description) e.setDescription(description);
    return e;
  }

  /** ℹ️ Blue info embed */
  static info(title: string, description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0x5865f2)
      .setTitle(`ℹ️ ${title}`);
    if (description) e.setDescription(description);
    return e;
  }

  /** 🔄 Loading / processing embed */
  static loading(title = 'Processing...', description?: string): EmbedBuilder {
    const e = new EmbedBuilder()
      .setColor(0xfaa61a)
      .setTitle(`🔄 ${title}`);
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
    if (opts.fields?.length) e.addFields(...opts.fields);
    if (opts.footerText) e.setFooter(opts.footerText);
    if (opts.avatarURL) e.setThumbnail(opts.avatarURL);
    return e;
  }

  /** Leaderboard embed */
  static leaderboard(
    title: string,
    entries: Array<{ rank: number; name: string; score: string | number }>,
    color = 0xfaa61a
  ): EmbedBuilder {
    const text = entries
      .map(e => `**${e.rank}.** ${e.name} — ${e.score}`)
      .join('\n');
    return new EmbedBuilder()
      .setColor(color)
      .setTitle(`🏆 ${title}`)
      .setDescription(text || 'No entries yet.');
  }
}
