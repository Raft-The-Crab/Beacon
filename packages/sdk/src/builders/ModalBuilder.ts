export class ModalBuilder {
  private data: any = {
    title: '',
    custom_id: '',
    components: []
  };

  setTitle(title: string): this {
    this.data.title = title;
    return this;
  }

  setCustomId(id: string): this {
    this.data.custom_id = id;
    return this;
  }

  addComponents(...components: any[]): this {
    this.data.components.push(...components);
    return this;
  }

  setComponents(components: any[]): this {
    this.data.components = components;
    return this;
  }

  toJSON() {
    return {
      ...this.data,
      components: this.data.components.map((c: any) => 
        typeof c === 'object' && c !== null && 'toJSON' in c ? c.toJSON() : c
      )
    };
  }
}
