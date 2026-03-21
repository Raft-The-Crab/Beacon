export type ButtonStyle = 'primary' | 'secondary' | 'success' | 'danger' | 'link'

export interface ButtonData {
  customId?: string
  label?: string
  style: ButtonStyle
  emoji?: string
  url?: string
  disabled?: boolean
}

/**
 * Builds an interactive button component for Beacon bot messages.
 *
 * @example
 * const btn = new ButtonBuilder()
 *   .setLabel('Click Me')
 *   .setStyle('primary')
 *   .setCustomId('my_button')
 *   .build()
 */
export class ButtonBuilder {
  private data: ButtonData = { style: 'secondary' }

  static create(): ButtonBuilder {
    return new ButtonBuilder()
  }

  setCustomId(id: string): this {
    this.data.customId = id
    return this
  }

  setLabel(label: string): this {
    this.data.label = label
    return this
  }

  setStyle(style: ButtonStyle): this {
    this.data.style = style
    return this
  }

  setEmoji(emoji: string): this {
    this.data.emoji = emoji
    return this
  }

  setURL(url: string): this {
    this.data.url = url
    this.data.style = 'link'
    return this
  }

  setDisabled(disabled = true): this {
    this.data.disabled = disabled
    return this
  }

  build(): ButtonData {
    return this.toJSON();
  }

  toJSON(): ButtonData {
    // Logic for returning flat data
    return { ...this.data } as any;
  }

  clone(): ButtonBuilder {
    const cloned = new ButtonBuilder()
    cloned.data = { ...this.data }
    return cloned
  }
}
