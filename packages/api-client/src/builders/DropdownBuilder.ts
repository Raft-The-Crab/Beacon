/**
 * DropdownBuilder — higher-level wrapper around SelectMenuBuilder
 * with convenience methods for common patterns like role/channel/user selects.
 */
export type DropdownType = 'string' | 'user' | 'role' | 'channel' | 'mentionable'

export interface DropdownOption {
  label: string
  value: string
  description?: string
  emoji?: string
  default?: boolean
}

export interface DropdownData {
  customId: string
  type: DropdownType
  placeholder?: string
  minValues: number
  maxValues: number
  disabled?: boolean
  options: DropdownOption[] // only for 'string' type
}

/**
 * Fluent builder for all Beacon dropdown select menu types.
 *
 * @example
 * // String dropdown
 * const dd = new DropdownBuilder()
 *   .setCustomId('pick_role')
 *   .setType('role')
 *   .setPlaceholder('Assign a role')
 *   .build()
 *
 * // Custom options dropdown
 * const dd2 = new DropdownBuilder()
 *   .setCustomId('fav_color')
 *   .setType('string')
 *   .addOption({ label: 'Red', value: 'red', emoji: '🔴' })
 *   .addOption({ label: 'Blue', value: 'blue', emoji: '🔵' })
 *   .build()
 */
export class DropdownBuilder {
  private data: DropdownData = {
    customId: '',
    type: 'string',
    minValues: 1,
    maxValues: 1,
    options: [],
  }

  setCustomId(id: string): this {
    this.data.customId = id
    return this
  }

  setType(type: DropdownType): this {
    this.data.type = type
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

  addOption(option: DropdownOption): this {
    if (this.data.type !== 'string') {
      throw new Error('DropdownBuilder: Options can only be added to string-type dropdowns.')
    }
    if (this.data.options.length >= 25) {
      throw new Error('DropdownBuilder: Maximum of 25 options allowed.')
    }
    this.data.options.push(option)
    return this
  }

  addOptions(...options: DropdownOption[]): this {
    options.forEach(o => this.addOption(o))
    return this
  }

  build(): DropdownData {
    if (!this.data.customId) throw new Error('DropdownBuilder: customId is required.')
    if (this.data.type === 'string' && this.data.options.length === 0) {
      throw new Error('DropdownBuilder: String-type dropdowns require at least one option.')
    }
    return { ...this.data, options: [...this.data.options] }
  }
}
