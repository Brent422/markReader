/**
 * TXT 文本解析核心：编码识别、解码、章节切分。
 *
 * 这里的函数全部是纯函数，不依赖 DOM 与数据库，便于单元测试。
 */

export type TxtEncoding = 'utf-8' | 'gb18030'

export interface Chapter {
  /** 章节序号，从 0 开始 */
  index: number
  /** 章节标题（取自标题行） */
  title: string
  /** 章节正文在全文中的起始字符偏移（含标题行） */
  start: number
  /** 章节正文在全文中的结束字符偏移（不含） */
  end: number
}

export interface DecodeResult {
  text: string
  encoding: TxtEncoding
}

/**
 * 章节标题行：第X章/节/回/卷/篇，以及常见的独立标题。
 *
 * 允许「第一章 开端」这类带标题名的写法：编号后必须紧跟空白或标点，
 * 且整行长度受限，避免把正文中以「第一章」开头的句子误判为标题。
 */
const CHAPTER_TITLE_RE =
  /^\s*(?:第[0-9零〇一二三四五六七八九十百千万两]+[章节回卷篇](?:[\s：:、.．][^\n]{0,40})?|序章|序言|自序|前言|楔子|引子|后记|尾声|番外(?:篇|章|分|[0-9零〇一二三四五六七八九十百千]+)?)\s*$/

/** 统一换行符为 \n，避免 \r\n 影响偏移计算 */
export function normalizeNewlines(text: string): string {
  return text.replace(/\r\n?/g, '\n')
}

/**
 * 识别编码：优先按 UTF-8 严格解码，失败则判定为 GB18030。
 * UTF-8 的字节序列在 GB18030 中通常也能解出（乱码），所以只能先试 UTF-8。
 */
export function detectEncoding(bytes: Uint8Array): TxtEncoding {
  // UTF-8 BOM 直接命中
  if (bytes.length >= 3 && bytes[0] === 0xef && bytes[1] === 0xbb && bytes[2] === 0xbf) {
    return 'utf-8'
  }
  try {
    new TextDecoder('utf-8', { fatal: true }).decode(bytes)
    return 'utf-8'
  } catch {
    return 'gb18030'
  }
}

/** 解码 TXT 文件内容，自动识别编码并去除 BOM */
export function decodeTxt(buffer: ArrayBuffer): DecodeResult {
  const bytes = new Uint8Array(buffer)
  const encoding = detectEncoding(bytes)
  const text = new TextDecoder(encoding).decode(bytes)
  return { text: stripBom(text), encoding }
}

function stripBom(text: string): string {
  return text.charCodeAt(0) === 0xfeff ? text.slice(1) : text
}

/**
 * 按标题行把全文切分成章节。
 *
 * - 未识别到任何标题时，整本书作为一章返回；
 * - 首个标题之前若有内容（书名、作者等），单独作为「开始」一章。
 */
export function splitChapters(rawText: string): Chapter[] {
  const text = normalizeNewlines(rawText)
  const chapters: Chapter[] = []
  const lines = text.split('\n')

  let lineStart = 0
  let current: { title: string; start: number } | null = null

  for (const line of lines) {
    const start = lineStart
    lineStart += line.length + 1 // +1 为换行符

    if (!CHAPTER_TITLE_RE.test(line)) continue
    const title = line.trim()
    if (title.length === 0) continue

    if (current) {
      chapters.push({
        index: chapters.length,
        title: current.title,
        start: current.start,
        end: start,
      })
    }
    current = { title, start }
  }

  if (current) {
    chapters.push({
      index: chapters.length,
      title: current.title,
      start: current.start,
      end: text.length,
    })
  }

  if (chapters.length === 0) {
    const firstLine = text.split('\n')[0]?.trim() ?? ''
    return [{ index: 0, title: firstLine.slice(0, 30) || '正文', start: 0, end: text.length }]
  }

  // 首个章节标题之前的内容单独成章
  if (chapters[0].start > 0) {
    const preface = text.slice(0, chapters[0].start).trim()
    if (preface.length > 0) {
      chapters.unshift({ index: 0, title: '开始', start: 0, end: chapters[0].start })
      chapters.forEach((c, i) => {
        c.index = i
      })
    }
  }

  return chapters
}

/** 取某一章的正文（去掉首行标题） */
export function chapterBody(text: string, chapter: Chapter): string {
  const raw = normalizeNewlines(text).slice(chapter.start, chapter.end)
  const firstNewline = raw.indexOf('\n')
  if (firstNewline === -1) return ''
  return raw.slice(firstNewline + 1)
}

/** 计算阅读百分比（0-100），便于书架显示进度 */
export function progressPercent(textLength: number, charOffset: number): number {
  if (textLength <= 0) return 0
  const ratio = charOffset / textLength
  return Math.min(100, Math.max(0, Math.round(ratio * 100)))
}
