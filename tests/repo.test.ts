import { beforeEach, describe, expect, it } from 'vitest'
import {
  deleteBook,
  getBook,
  getProgress,
  importTxtFile,
  listBooks,
  saveProgress,
} from '../src/db/repo'
import { db } from '../src/db/schema'

function txtFile(content: Uint8Array<ArrayBuffer>, name: string): File {
  return new File([content], name, { type: 'text/plain' })
}

beforeEach(async () => {
  await db.books.clear()
  await db.progress.clear()
})

describe('importTxtFile', () => {
  it('导入 GBK 编码的 txt，正确识别编码、书名与字符数', async () => {
    // '中文' 的 GBK 编码
    const file = txtFile(new Uint8Array([0xd6, 0xd0, 0xce, 0xc4]), '测试小说.txt')
    const book = await importTxtFile(file)

    expect(book.title).toBe('测试小说')
    expect(book.text).toBe('中文')
    expect(book.encoding).toBe('gb18030')
    expect(book.charCount).toBe(2)
  })

  it('导入后出现在书架列表里', async () => {
    await importTxtFile(txtFile(new Uint8Array([0x61, 0x62]), 'a.txt'))
    const list = await listBooks()

    expect(list).toHaveLength(1)
    expect(list[0].title).toBe('a')
    expect(list[0].text).toBe('ab')
  })

  it('多本书按导入时间倒序排列', async () => {
    await importTxtFile(txtFile(new Uint8Array([0x61]), 'first.txt'))
    await new Promise((resolve) => setTimeout(resolve, 5))
    await importTxtFile(txtFile(new Uint8Array([0x62]), 'second.txt'))

    const list = await listBooks()
    expect(list.map((b) => b.title)).toEqual(['second', 'first'])
  })
})

describe('阅读进度', () => {
  it('保存后可读回同一个偏移', async () => {
    const book = await importTxtFile(txtFile(new Uint8Array([0x61, 0x62, 0x63]), 'b.txt'))
    await saveProgress(book.id, 2)

    const progress = await getProgress(book.id)
    expect(progress?.charOffset).toBe(2)
  })

  it('同一本书再次保存时覆盖旧值', async () => {
    const book = await importTxtFile(txtFile(new Uint8Array([0x61, 0x62, 0x63]), 'c.txt'))
    await saveProgress(book.id, 1)
    await saveProgress(book.id, 3)

    expect((await getProgress(book.id))?.charOffset).toBe(3)
  })

  it('未读过的书没有进度记录', async () => {
    const book = await importTxtFile(txtFile(new Uint8Array([0x61]), 'd.txt'))
    expect(await getProgress(book.id)).toBeUndefined()
  })
})

describe('deleteBook', () => {
  it('删除书籍时一并清理进度', async () => {
    const book = await importTxtFile(txtFile(new Uint8Array([0x61]), 'e.txt'))
    await saveProgress(book.id, 1)

    await deleteBook(book.id)

    expect(await getBook(book.id)).toBeUndefined()
    expect(await getProgress(book.id)).toBeUndefined()
    expect(await listBooks()).toHaveLength(0)
  })
})
