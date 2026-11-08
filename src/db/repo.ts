import { decodeTxt, titleFromFileName } from '../core/txt'
import { db, type BookRow, type ProgressRow } from './schema'

/** 导入一个本地 .txt 文件并写入书架 */
export async function importTxtFile(file: File): Promise<BookRow> {
  const buffer = await file.arrayBuffer()
  const { text, encoding } = decodeTxt(buffer)

  const row: BookRow = {
    id: crypto.randomUUID(),
    title: titleFromFileName(file.name),
    size: file.size,
    encoding,
    charCount: text.length,
    text,
    createdAt: Date.now(),
  }

  await db.books.add(row)
  return row
}

/** 书架列表，最近导入的排在前面 */
export function listBooks(): Promise<BookRow[]> {
  return db.books.orderBy('createdAt').reverse().toArray()
}

export function getBook(id: string): Promise<BookRow | undefined> {
  return db.books.get(id)
}

/** 删除书籍，同时清理其阅读进度 */
export async function deleteBook(id: string): Promise<void> {
  await db.transaction('rw', db.books, db.progress, async () => {
    await db.books.delete(id)
    await db.progress.delete(id)
  })
}

export async function saveProgress(bookId: string, charOffset: number): Promise<void> {
  await db.progress.put({ bookId, charOffset, updatedAt: Date.now() })
}

export function getProgress(bookId: string): Promise<ProgressRow | undefined> {
  return db.progress.get(bookId)
}
