export interface CardField {
  name: string
  value: string
  inline?: boolean
}

export interface CardData {
  title?: string
  description?: string
  color?: number
  thumbnail?: string
  image?: string
  fields: CardField[]
  footer?: string
  timestamp?: boolean
  author?: { name: string; iconUrl?: string; url?: string }
}

/**
 * A rich card builder for Beacon bot messages.
 * Similar to embeds but with Beacon-native rendering.
 *
 * @example
 * const card = new CardBuilder()
 *   .setTitle('Server Stats')
 *   .setColor(0x7289da)
 *   .addField({ name: 'Members', value: '1,234', inline: true })
 *   .addField({ name: 'Online', value: '567', inline: true })
 *   .setTimestamp()
 *   .build()
 */
export class CardBuilder {
  private data: CardData = { fields: [] }

  setTitle(title: string): this {
    this.data.title = title
    return this
  }

  setDescription(desc: string): this {
    this.data.description = desc
    return this
  }

  setColor(color: number): this {
    this.data.color = color
    return this
  }

  setThumbnail(url: string): this {
    this.data.thumbnail = url
    return this
  }

  setImage(url: string): this {
    this.data.image = url
    return this
  }

  setFooter(text: string): this {
    this.data.footer = text
    return this
  }

  setTimestamp(enabled = true): this {
    this.data.timestamp = enabled
    return this
  }

  setAuthor(name: string, iconUrl?: string, url?: string): this {
    this.data.author = { name, iconUrl, url }
    return this
  }

  addField(field: CardField): this {
    if (this.data.fields.length >= 25) {
      throw new Error('CardBuilder: Maximum of 25 fields allowed.')
    }
    this.data.fields.push(field)
    return this
  }

  addFields(...fields: CardField[]): this {
    fields.forEach(f => this.addField(f))
    return this
  }

  build(): CardData {
    if (!this.data.title && !this.data.description && this.data.fields.length === 0) {
      throw new Error('CardBuilder: Card must have at least a title, description, or one field.')
    }
    return { ...this.data, fields: [...this.data.fields] }
  }
}
