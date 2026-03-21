export interface SelectMenuData {
  customId: string;
  placeholder?: string;
  minValues?: number;
  maxValues?: number;
  options: any[];
  disabled?: boolean;
}

export class SelectMenuBuilder {
  private data: any = {
    type: 3, // STRING_SELECT
    custom_id: '',
    options: [],
    placeholder: undefined,
    min_values: undefined,
    max_values: undefined,
    disabled: false
  };

  setCustomId(id: string): this {
    this.data.custom_id = id;
    return this;
  }

  setPlaceholder(placeholder: string): this {
    this.data.placeholder = placeholder;
    return this;
  }

  setMinValues(min: number): this {
    this.data.min_values = min;
    return this;
  }

  setMaxValues(max: number): this {
    this.data.max_values = max;
    return this;
  }

  setDisabled(disabled = true): this {
    this.data.disabled = disabled;
    return this;
  }

  addOptions(...options: { label: string; value: string; description?: string; emoji?: any; default?: boolean }[]): this {
    this.data.options.push(...options);
    return this;
  }

  setOptions(options: { label: string; value: string; description?: string; emoji?: any; default?: boolean }[]): this {
    this.data.options = options;
    return this;
  }

  toJSON() {
    return { ...this.data };
  }
}
