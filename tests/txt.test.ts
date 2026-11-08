import { describe, expect, it } from 'vitest'
import {
  chapterBody,
  decodeTxt,
  detectEncoding,
  normalizeNewlines,
  progressPercent,
  splitChapters,
} from '../src/core/txt'

function bytesOf(values: number[]): ArrayBuffer {
  return new Uint8Array(values).buffer
}

describe('detectEncoding', () => {
  it('把合法 UTF-8 中文识别为 utf-8', () => {
    // '中文' 的 UTF-8 编码
    expect(detectEncoding(new Uint8Array([0xe4, 0xb8, 0xad, 0xe6, 0x96, 0x87]))).toBe('utf-8')
  })

  it('把纯 ASCII 识别为 utf-8', () => {
    expect(detectEncoding(new Uint8Array([0x61, 0x62, 0x63]))).toBe('utf-8')
  })

  it('把 GBK 中文识别为 gb18030', () => {
    // '中文' 的 GBK 编码：D6 D0 CE C4
    expect(detectEncoding(new Uint8Array([0xd6, 0xd0, 0xce, 0xc4]))).toBe('gb18030')
  })

  it('把带 BOM 的内容识别为 utf-8', () => {
    expect(detectEncoding(new Uint8Array([0xef, 0xbb, 0xbf, 0x61]))).toBe('utf-8')
  })
})

describe('decodeTxt', () => {
  it('解码 GBK 编码的中文', () => {
    const { text, encoding } = decodeTxt(bytesOf([0xd6, 0xd0, 0xce, 0xc4]))
    expect(text).toBe('中文')
    expect(encoding).toBe('gb18030')
  })

  it('解码 UTF-8 并去除 BOM', () => {
    const { text, encoding } = decodeTxt(bytesOf([0xef, 0xbb, 0xbf, 0x48, 0x69]))
    expect(text).toBe('Hi')
    expect(encoding).toBe('utf-8')
  })
})

describe('normalizeNewlines', () => {
  it('把 CRLF 与 CR 统一为 LF', () => {
    expect(normalizeNewlines('a\r\nb\rc')).toBe('a\nb\nc')
  })
})

describe('splitChapters', () => {
  const sample = [
    '书名：测试小说',
    '',
    '第一章 开端',
    '第一章的正文内容。',
    '',
    '第二章 发展',
    '第二章的正文内容。',
  ].join('\n')

  it('识别章节标题并保留标题前的「开始」章', () => {
    const chapters = splitChapters(sample)
    expect(chapters.map((c) => c.title)).toEqual(['开始', '第一章 开端', '第二章 发展'])
  })

  it('章节偏移首尾相接且覆盖全文', () => {
    const chapters = splitChapters(sample)
    expect(chapters[0].start).toBe(0)
    expect(chapters[chapters.length - 1].end).toBe(sample.length)
    for (let i = 0; i < chapters.length - 1; i += 1) {
      expect(chapters[i].end).toBe(chapters[i + 1].start)
    }
  })

  it('没有章节标题时整本书作为一章', () => {
    const plain = '只是一段普通正文，没有任何章节标题。'
    const chapters = splitChapters(plain)
    expect(chapters).toHaveLength(1)
    expect(chapters[0]).toMatchObject({ index: 0, start: 0, end: plain.length })
  })

  it('识别「第X回」「序章」「番外」等标题', () => {
    const text = ['序章', '引子内容。', '第五回 风波', '回目内容。', '番外一', '番外内容。'].join('\n')
    const titles = splitChapters(text).map((c) => c.title)
    expect(titles).toEqual(['序章', '第五回 风波', '番外一'])
  })

  it('正文中间出现的「第一章」字样不会被误判为标题', () => {
    const text = ['第一章 真实标题', '他写道：第一章的重要性在于开篇。'].join('\n')
    const chapters = splitChapters(text)
    expect(chapters).toHaveLength(1)
  })
})

describe('chapterBody', () => {
  it('去掉章首的标题行，只返回正文', () => {
    const text = ['第一章 开端', '正文第一段。', '正文第二段。'].join('\n')
    const [chapter] = splitChapters(text)
    expect(chapterBody(text, chapter)).toBe('正文第一段。\n正文第二段。')
  })
})

describe('progressPercent', () => {
  it('按字符偏移换算百分比', () => {
    expect(progressPercent(1000, 500)).toBe(50)
    expect(progressPercent(1000, 0)).toBe(0)
    expect(progressPercent(1000, 1000)).toBe(100)
  })

  it('对越界值做钳制', () => {
    expect(progressPercent(1000, -10)).toBe(0)
    expect(progressPercent(1000, 2000)).toBe(100)
    expect(progressPercent(0, 0)).toBe(0)
  })
})
