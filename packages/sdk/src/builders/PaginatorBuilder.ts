export interface PaginatorPage {
  title?: string
  content: string
  imageUrl?: string
}

export interface PaginatorData {
  pages: PaginatorPage[]
  customId: string
  showPageCount?: boolean
  loopPages?: boolean
  timeout?: number // ms before controls are disabled, default 300000 (5 min)
}

/**
 * Creates paginated message embeds with navigation buttons.
 * Perfect for help menus, leaderboards, and long content.
 *
 * @example
 * const paginator = new PaginatorBuilder()
 *   .setCustomId('help_paginator')
 *   .addPage({ title: 'Page 1', content: 'First page content here.' })
 *   .addPage({ title: 'Page 2', content: 'Second page content here.' })
 *   .setLoopPages(true)
 *   .build()
 */
export class PaginatorBuilder {
  private data: PaginatorData = { pages: [], customId: '' }

  setCustomId(id: string): this {
    this.data.customId = id
    return this
  }

  addPage(page: PaginatorPage): this {
    this.data.pages.push(page)
    return this
  }

  addPages(...pages: PaginatorPage[]): this {
    pages.forEach(p => this.addPage(p))
    return this
  }

  showPageCount(show = true): this {
    this.data.showPageCount = show
    return this
  }

  setLoopPages(loop = true): this {
    this.data.loopPages = loop
    return this
  }

  setTimeout(ms: number): this {
    this.data.timeout = ms
    return this
  }

  build(): PaginatorData {
    if (!this.data.customId) throw new Error('PaginatorBuilder: customId is required.')
    if (this.data.pages.length < 2) throw new Error('PaginatorBuilder: At least 2 pages required.')
    return { showPageCount: true, loopPages: false, timeout: 300_000, ...this.data, pages: [...this.data.pages] }
  }
}
