export interface TextInputData {
  customId: string
  label: string
  style: 'short' | 'paragraph'
  placeholder?: string
  value?: string
  required?: boolean
  minLength?: number
  maxLength?: number
}

export interface ModalData {
  customId: string
  title: string
  components: TextInputData[]
}

/**
 * Builds an interactive modal (popup form) for Beacon bots.
 *
 * @example
 * const modal = new ModalBuilder()
 *   .setCustomId('feedback_modal')
 *   .setTitle('Submit Feedback')
 *   .addTextInput({
 *     customId: 'feedback_text',
 *     label: 'Your feedback',
 *     style: 'paragraph',
 *     placeholder: 'Tell us what you think...',
 *     required: true,
 *   })
 *   .build()
 */
export class ModalBuilder {
  private data: ModalData = { customId: '', title: '', components: [] }

  setCustomId(id: string): this {
    this.data.customId = id
    return this
  }

  setTitle(title: string): this {
    if (title.length > 45) throw new Error('ModalBuilder: Title cannot exceed 45 characters.')
    this.data.title = title
    return this
  }

  addTextInput(input: TextInputData): this {
    if (this.data.components.length >= 5) {
      throw new Error('ModalBuilder: Maximum of 5 text inputs per modal.')
    }
    this.data.components.push(input)
    return this
  }

  build(): ModalData {
    if (!this.data.customId) throw new Error('ModalBuilder: customId is required.')
    if (!this.data.title) throw new Error('ModalBuilder: title is required.')
    if (this.data.components.length === 0) throw new Error('ModalBuilder: At least one text input is required.')
    return { ...this.data, components: [...this.data.components] }
  }
}
