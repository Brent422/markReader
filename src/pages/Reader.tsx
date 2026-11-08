import { useEffect, useRef, useState } from 'react'
import { offsetFromRatio, ratioFromOffset } from '../core/txt'
import type { BookRow } from '../db/schema'
import { getBook, getProgress, saveProgress } from '../db/repo'

interface ReaderProps {
  bookId: string
  onBack: () => void
}

/** 滚动停止多久后落库 */
const SAVE_DELAY_MS = 400

export default function Reader({ bookId, onBack }: ReaderProps) {
  const [book, setBook] = useState<BookRow | null>(null)
  const [error, setError] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  /** 当前阅读位置（全文字符偏移） */
  const offsetRef = useRef(0)
  const timerRef = useRef<number | null>(null)

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const [row, progress] = await Promise.all([getBook(bookId), getProgress(bookId)])
      if (cancelled) return
      if (!row) {
        setError('书籍不存在，可能已被删除')
        return
      }
      offsetRef.current = progress?.charOffset ?? 0
      setBook(row)
    })()
    return () => {
      cancelled = true
    }
  }, [bookId])

  // 书籍加载完成后，按记录的偏移恢复滚动位置
  useEffect(() => {
    const element = scrollRef.current
    if (!book || !element) return

    const ratio = ratioFromOffset(book.charCount, offsetRef.current)
    const frame = requestAnimationFrame(() => {
      element.scrollTop = ratio * Math.max(0, element.scrollHeight - element.clientHeight)
    })
    return () => cancelAnimationFrame(frame)
  }, [book])

  // 离开阅读页时保存最终位置
  useEffect(() => {
    return () => {
      if (timerRef.current !== null) window.clearTimeout(timerRef.current)
      void saveProgress(bookId, offsetRef.current)
    }
  }, [bookId])

  function handleScroll() {
    const element = scrollRef.current
    if (!element || !book) return

    const max = element.scrollHeight - element.clientHeight
    const ratio = max > 0 ? element.scrollTop / max : 0
    offsetRef.current = offsetFromRatio(book.charCount, ratio)

    if (timerRef.current !== null) window.clearTimeout(timerRef.current)
    timerRef.current = window.setTimeout(() => {
      void saveProgress(bookId, offsetRef.current)
    }, SAVE_DELAY_MS)
  }

  if (error) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <button className="btn" onClick={onBack}>
            ← 书架
          </button>
        </header>
        <main className="empty-state">
          <p className="empty-title">{error}</p>
        </main>
      </div>
    )
  }

  if (!book) {
    return (
      <div className="app-shell">
        <header className="topbar">
          <button className="btn" onClick={onBack}>
            ← 书架
          </button>
        </header>
        <main className="empty-state">
          <p className="empty-hint">正在打开…</p>
        </main>
      </div>
    )
  }

  return (
    <div className="reader">
      <header className="topbar reader-bar">
        <button className="btn" onClick={onBack}>
          ← 书架
        </button>
        <span className="reader-title" title={book.title}>
          {book.title}
        </span>
      </header>
      <div className="reader-scroll" ref={scrollRef} onScroll={handleScroll}>
        <article className="reader-text">{book.text}</article>
      </div>
    </div>
  )
}
