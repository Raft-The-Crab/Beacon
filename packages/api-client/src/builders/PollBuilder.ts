export interface PollOption {
  text: string
  emoji?: string
}

export interface PollData {
  question: string
  options: PollOption[]
  duration?: number // hours, default 24
  allowMultiselect?: boolean
  anonymous?: boolean
}

/**
 * Creates a poll embed for Beacon channels.
 *
 * @example
 * const poll = new PollBuilder()
 *   .setQuestion('What is your favorite feature?')
 *   .addOption({ text: 'Voice channels', emoji: '🎤' })
 *   .addOption({ text: 'Beacoin economy', emoji: '🪙' })
 *   .setDuration(48)
 *   .build()
 */
export class PollBuilder {
  private data: PollData = { question: '', options: [] }

  setQuestion(question: string): this {
    if (question.length > 300) throw new Error('PollBuilder: Question cannot exceed 300 characters.')
    this.data.question = question
    return this
  }

  addOption(option: PollOption): this {
    if (this.data.options.length >= 10) {
      throw new Error('PollBuilder: Maximum of 10 options allowed.')
    }
    this.data.options.push(option)
    return this
  }

  addOptions(...options: PollOption[]): this {
    options.forEach(o => this.addOption(o))
    return this
  }

  setDuration(hours: number): this {
    this.data.duration = hours
    return this
  }

  setMultiselect(allow = true): this {
    this.data.allowMultiselect = allow
    return this
  }

  setAnonymous(anon = true): this {
    this.data.anonymous = anon
    return this
  }

  build(): PollData {
    if (!this.data.question) throw new Error('PollBuilder: question is required.')
    if (this.data.options.length < 2) throw new Error('PollBuilder: At least 2 options required.')
    return { duration: 24, ...this.data, options: [...this.data.options] }
  }
}
