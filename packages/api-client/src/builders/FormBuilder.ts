export interface FormField {
  id: string
  label: string
  type: 'text' | 'number' | 'select' | 'checkbox' | 'textarea'
  placeholder?: string
  required?: boolean
  options?: Array<{ label: string; value: string }> // for 'select' type
  min?: number
  max?: number
}

export interface FormData {
  id: string
  title: string
  description?: string
  fields: FormField[]
  submitLabel?: string
}

/**
 * Builds a structured data collection form that can be rendered
 * in Beacon channels and responds to bot interactions.
 *
 * @example
 * const form = new FormBuilder()
 *   .setId('application_form')
 *   .setTitle('Server Application')
 *   .setDescription('Fill out this form to apply to our server.')
 *   .addField({ id: 'reason', label: 'Why do you want to join?', type: 'textarea', required: true })
 *   .setSubmitLabel('Submit Application')
 *   .build()
 */
export class FormBuilder {
  private data: FormData = { id: '', title: '', fields: [] }

  setId(id: string): this {
    this.data.id = id
    return this
  }

  setTitle(title: string): this {
    this.data.title = title
    return this
  }

  setDescription(desc: string): this {
    this.data.description = desc
    return this
  }

  addField(field: FormField): this {
    if (this.data.fields.length >= 20) {
      throw new Error('FormBuilder: Maximum of 20 fields allowed.')
    }
    this.data.fields.push(field)
    return this
  }

  setSubmitLabel(label: string): this {
    this.data.submitLabel = label
    return this
  }

  build(): FormData {
    if (!this.data.id) throw new Error('FormBuilder: id is required.')
    if (!this.data.title) throw new Error('FormBuilder: title is required.')
    if (this.data.fields.length === 0) throw new Error('FormBuilder: At least one field is required.')
    return { submitLabel: 'Submit', ...this.data, fields: [...this.data.fields] }
  }
}
