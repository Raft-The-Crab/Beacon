/**
 * EmbedBuilder - Create rich embeds
 */

export interface Embed {
  title?: string;
  description?: string;
  url?: string;
  timestamp?: string;
  color?: number;
  footer?: {
    text: string;
    icon_url?: string;
  };
  image?: {
    url: string;
  };
  thumbnail?: {
    url: string;
  };
  author?: {
    name: string;
    url?: string;
    icon_url?: string;
  };
  fields?: {
    name: string;
    value: string;
    inline?: boolean;
  }[];
}

export class EmbedBuilder {
  private embed: Partial<Embed> = {};

  setTitle(title: string): this {
    if (title.length > 256) {
      throw new Error('Title must be 256 characters or less');
    }
    this.embed.title = title;
    return this;
  }

  setDescription(description: string): this {
    if (description.length > 4096) {
      throw new Error('Description must be 4096 characters or less');
    }
    this.embed.description = description;
    return this;
  }

  setURL(url: string): this {
    this.embed.url = url;
    return this;
  }

  setTimestamp(timestamp?: Date | number | string): this {
    this.embed.timestamp = timestamp ? new Date(timestamp).toISOString() : new Date().toISOString();
    return this;
  }

  setColor(color: number | string): this {
    if (typeof color === 'string') {
      // Convert hex to number
      this.embed.color = parseInt(color.replace('#', ''), 16);
    } else {
      this.embed.color = color;
    }
    return this;
  }

  setFooter(text: string, iconURL?: string): this {
    if (text.length > 2048) {
      throw new Error('Footer text must be 2048 characters or less');
    }
    this.embed.footer = { text, icon_url: iconURL };
    return this;
  }

  setImage(url: string): this {
    this.embed.image = { url };
    return this;
  }

  setThumbnail(url: string): this {
    this.embed.thumbnail = { url };
    return this;
  }

  setAuthor(name: string, url?: string, iconURL?: string): this {
    if (name.length > 256) {
      throw new Error('Author name must be 256 characters or less');
    }
    this.embed.author = { name, url, icon_url: iconURL };
    return this;
  }

  addFields(...fields: { name: string; value: string; inline?: boolean }[]): this {
    if (!this.embed.fields) {
      this.embed.fields = [];
    }
    
    for (const field of fields) {
      if (field.name.length > 256) {
        throw new Error('Field name must be 256 characters or less');
      }
      if (field.value.length > 1024) {
        throw new Error('Field value must be 1024 characters or less');
      }
      this.embed.fields.push(field);
    }

    if (this.embed.fields.length > 25) {
      throw new Error('Embeds can have at most 25 fields');
    }

    return this;
  }

  spliceFields(index: number, deleteCount: number, ...fields: { name: string; value: string; inline?: boolean }[]): this {
    if (!this.embed.fields) {
      this.embed.fields = [];
    }
    this.embed.fields.splice(index, deleteCount, ...fields);
    return this;
  }

  toJSON(): Embed {
    const totalLength = 
      (this.embed.title?.length ?? 0) +
      (this.embed.description?.length ?? 0) +
      (this.embed.footer?.text.length ?? 0) +
      (this.embed.author?.name.length ?? 0) +
      (this.embed.fields?.reduce((sum, f) => sum + f.name.length + f.value.length, 0) ?? 0);

    if (totalLength > 6000) {
      throw new Error('Embed total length must be 6000 characters or less');
    }

    return this.embed as Embed;
  }
}
