import { MessageBuilder } from './MessageBuilder';

export interface CalendarEvent {
  title: string;
  start: Date;
  end?: Date;
  description?: string;
  location?: string;
  color?: string;
}

/**
 * CalendarBuilder — High-level builder for event management and scheduling.
 * Helps create structured event embeds and interactions.
 */
export class CalendarBuilder {
  private events: CalendarEvent[] = [];
  private themeColor: string = '#5865F2';

  public addEvent(event: CalendarEvent): this {
    this.events.push(event);
    return this;
  }

  public setThemeColor(color: string): this {
    this.themeColor = color;
    return this;
  }

  public toMessage(): MessageBuilder {
    const builder = new MessageBuilder();
    const embed: any = {
      title: '📅 Beacon Event Calendar',
      color: this.themeColor,
      fields: this.events.map(e => ({
        name: `${e.start.toLocaleDateString()} — ${e.title}`,
        value: `${e.description || 'No description'}${e.location ? `\n📍 ${e.location}` : ''}`,
        inline: false
      }))
    };

    builder.addEmbed(embed);
    return builder;
  }
}
