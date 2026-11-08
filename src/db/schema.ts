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
  createdAt: number
}

export interface ProgressRow {
  bookId: string
  /** 当前章节序号 */
  chapterIndex: number
  /** 章内字符偏移 */
  charOffset: number
  updatedAt: number
}

export interface AnnotationRow {
  id: string
  bookId: string
  chapterIndex: number
  /** 章内起始字符偏移 */
  start: number
  /** 章内结束字符偏移 */
  end: number
  /** 被划线的原文 */
  text: string
  /** 用户笔记 */
  note: string
  color: string
  createdAt: number
}

class MarkReaderDB extends Dexie {
  books!: Table<BookRow, string>
  progress!: Table<ProgressRow, string>
  annotations!: Table<AnnotationRow, string>

  constructor() {
    super('mark-reader')
    this.version(1).stores({
      books: 'id, createdAt',
      progress: 'bookId',
      annotations: 'id, bookId, chapterIndex',
    })
  }
}

export const db = new MarkReaderDB()
