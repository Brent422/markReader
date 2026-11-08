import Dexie, { type Table } from 'dexie'

export interface BookRow {
  /** 书 ID（uuid） */
  id: string
  title: string
  /** 文件字节数 */
  size: number
  /** 识别出的编码 */
  encoding: string
  /** 全文字符数 */
  charCount: number
  /** 全文内容 */
  text: string
  createdAt: number
}

export interface ProgressRow {
  bookId: string
  /** 全文字符偏移，代表读到哪个位置 */
  charOffset: number
  updatedAt: number
}

class MarkReaderDB extends Dexie {
  books!: Table<BookRow, string>
  progress!: Table<ProgressRow, string>

  constructor() {
    super('mark-reader')
    // v1：早期结构，含章节进度与批注表
    this.version(1).stores({
      books: 'id, createdAt',
      progress: 'bookId',
      annotations: 'id, bookId, chapterIndex',
    })
    // v2：移除章节与批注，进度简化为单一字符偏移
    this.version(2).stores({
      books: 'id, createdAt',
      progress: 'bookId',
      annotations: null,
    })
  }
}

export const db = new MarkReaderDB()
