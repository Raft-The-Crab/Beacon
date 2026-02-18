import type { ButtonData } from './ButtonBuilder'
import type { SelectMenuData } from './SelectMenuBuilder'

export type ActionRowComponent = ButtonData | SelectMenuData

export interface ActionRowData {
  components: ActionRowComponent[]
}

/**
 * Wraps interactive components (buttons, select menus) in a single row.
 * Each message supports up to 5 action rows; each row up to 5 buttons OR 1 select menu.
 *
 * @example
 * const row = new ActionRowBuilder()
 *   .addComponent(new ButtonBuilder().setLabel('OK').setStyle('success').setCustomId('ok').build())
 *   .build()
 */
export class ActionRowBuilder {
  private components: ActionRowComponent[] = []

  addComponent(component: ActionRowComponent): this {
    if (this.components.length >= 5) {
      throw new Error('ActionRowBuilder: Maximum of 5 components per row.')
    }
    this.components.push(component)
    return this
  }

  addComponents(...components: ActionRowComponent[]): this {
    components.forEach(c => this.addComponent(c))
    return this
  }

  build(): ActionRowData {
    if (this.components.length === 0) {
      throw new Error('ActionRowBuilder: At least one component is required.')
    }
    return { components: [...this.components] }
  }
}
