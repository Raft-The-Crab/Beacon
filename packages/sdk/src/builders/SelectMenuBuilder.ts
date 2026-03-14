export interface SelectMenuOption {
  label: string
  value: string
  description?: string
  emoji?: string
  default?: boolean
}

export interface SelectMenuData {
  customId: string
  placeholder?: string
  minValues?: number
  maxValues?: number
  disabled?: boolean
  options: SelectMenuOption[]
}

/**
 * Builds a dropdown select menu component for Beacon bot messages.
 *
 * @example
 * const menu = new SelectMenuBuilder()
 *   .setCustomId('color_select')
 *   .setPlaceholder('Pick a color')
 *   .addOption({ label: 'Red', value: 'red' })
 *   .addOption({ label: 'Blue', value: 'blue' })
 *   .build()
 */
export class SelectMenuBuilder {
  private data: SelectMenuData = { customId: '', options: [] }

  setCustomId(id: string): this {
    this.data.customId = id
    return this
  }

  setPlaceholder(text: string): this {
    this.data.placeholder = text
    return this
  }

  setMinValues(min: number): this {
    this.data.minValues = min
    return this
  }

  setMaxValues(max: number): this {
    this.data.maxValues = max
    return this
  }

  setDisabled(disabled = true): this {
    this.data.disabled = disabled
    return this
  }

  addOption(option: SelectMenuOption): this {
    if (this.data.options.length >= 25) {
      throw new Error('SelectMenuBuilder: Maximum of 25 options allowed.')
    }
    this.data.options.push(option)
    return this
  }

  addOptions(...options: SelectMenuOption[]): this {
    options.forEach(o => this.addOption(o))
    return this
  }

  build(): SelectMenuData {
    if (!this.data.customId) throw new Error('SelectMenuBuilder: customId is required.')
    if (this.data.options.length === 0) throw new Error('SelectMenuBuilder: At least one option is required.')
    return { ...this.data, options: [...this.data.options] }
  }
}
