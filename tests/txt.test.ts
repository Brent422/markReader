import { describe, expect, it } from 'vitest'
import {
  decodeTxt,
  detectEncoding,
  normalizeNewlines,
  offsetFromRatio,
  progressPercent,
  ratioFromOffset,
  titleFromFileName,
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

describe('titleFromFileName', () => {
  it('去掉 .txt 后缀作为书名', () => {
    expect(titleFromFileName('三体.txt')).toBe('三体')
    expect(titleFromFileName('a.TXT')).toBe('a')
  })

  it('没有后缀时保留原名', () => {
    expect(titleFromFileName('未命名文稿')).toBe('未命名文稿')
  })

  it('空文件名回退为「未命名」', () => {
    expect(titleFromFileName('.txt')).toBe('未命名')
    expect(titleFromFileName('   ')).toBe('未命名')
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

describe('比例与偏移互转', () => {
  it('偏移转比例', () => {
    expect(ratioFromOffset(1000, 250)).toBeCloseTo(0.25)
    expect(ratioFromOffset(1000, 0)).toBe(0)
    expect(ratioFromOffset(1000, 5000)).toBe(1)
    expect(ratioFromOffset(0, 100)).toBe(0)
  })

  it('比例转偏移', () => {
    expect(offsetFromRatio(1000, 0.25)).toBe(250)
    expect(offsetFromRatio(1000, -1)).toBe(0)
    expect(offsetFromRatio(1000, 2)).toBe(1000)
    expect(offsetFromRatio(0, 0.5)).toBe(0)
  })

  it('两者互为逆运算（取整误差内）', () => {
    const length = 12345
    const offset = 4567
    expect(offsetFromRatio(length, ratioFromOffset(length, offset))).toBe(offset)
  })
})
