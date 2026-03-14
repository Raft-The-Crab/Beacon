export interface TableColumn {
  key: string
  header: string
  align?: 'left' | 'center' | 'right'
  width?: number
}

export type TableRow = Record<string, string | number>

export interface TableData {
  title?: string
  columns: TableColumn[]
  rows: TableRow[]
  striped?: boolean
  maxRows?: number
}

/**
 * Renders a formatted table in a Beacon channel message.
 * Great for leaderboards, stats, and structured data.
 *
 * @example
 * const table = new TableBuilder()
 *   .setTitle('Top 5 Members')
 *   .addColumn({ key: 'rank', header: '#', align: 'center' })
 *   .addColumn({ key: 'name', header: 'Member', align: 'left' })
 *   .addColumn({ key: 'points', header: 'Beacoin', align: 'right' })
 *   .addRow({ rank: 1, name: 'Alice', points: 9420 })
 *   .addRow({ rank: 2, name: 'Bob', points: 7810 })
 *   .setStriped(true)
 *   .build()
 */
export class TableBuilder {
  private data: TableData = { columns: [], rows: [] }

  setTitle(title: string): this {
    this.data.title = title
    return this
  }

  addColumn(column: TableColumn): this {
    this.data.columns.push(column)
    return this
  }

  addColumns(...columns: TableColumn[]): this {
    columns.forEach(c => this.addColumn(c))
    return this
  }

  addRow(row: TableRow): this {
    this.data.rows.push(row)
    return this
  }

  addRows(...rows: TableRow[]): this {
    rows.forEach(r => this.addRow(r))
    return this
  }

  setStriped(striped = true): this {
    this.data.striped = striped
    return this
  }

  setMaxRows(max: number): this {
    this.data.maxRows = max
    return this
  }

  build(): TableData {
    if (this.data.columns.length === 0) throw new Error('TableBuilder: At least one column is required.')
    if (this.data.rows.length === 0) throw new Error('TableBuilder: At least one row is required.')
    return { striped: false, ...this.data, columns: [...this.data.columns], rows: [...this.data.rows] }
  }
}
