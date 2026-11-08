/**
 * TXT 文本解析核心：编码识别与解码。
 *
 * 这里的函数全部是纯函数，不依赖 DOM 与数据库，便于单元测试。
 */

export type TxtEncoding = 'utf-8' | 'gb18030'

export interface DecodeResult {
  text: string
  encoding: TxtEncoding
}

/** 统一换行符为 \n */
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

/** 从文件名推导书名：去掉 .txt 后缀 */
export function titleFromFileName(fileName: string): string {
  const title = fileName.replace(/\.txt$/i, '').trim()
  return title.length > 0 ? title : '未命名'
}

/** 计算阅读百分比（0-100） */
export function progressPercent(textLength: number, charOffset: number): number {
  if (textLength <= 0) return 0
  const ratio = charOffset / textLength
  return Math.min(100, Math.max(0, Math.round(ratio * 100)))
}

/** 由字符偏移换算滚动比例（0-1），用于恢复阅读位置 */
export function ratioFromOffset(textLength: number, charOffset: number): number {
  if (textLength <= 0) return 0
  return Math.min(1, Math.max(0, charOffset / textLength))
}

/** 由滚动比例换算字符偏移 */
export function offsetFromRatio(textLength: number, ratio: number): number {
  if (textLength <= 0) return 0
  const clamped = Math.min(1, Math.max(0, ratio))
  return Math.round(clamped * textLength)
}
