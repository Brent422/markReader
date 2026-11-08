import { useEffect, useRef, useState } from 'react'
import { progressPercent } from '../core/txt'
import type { BookRow } from '../db/schema'
import { deleteBook, getProgress, importTxtFile, listBooks } from '../db/repo'

interface LibraryProps {
  onOpen: (bookId: string) => void
}

interface BookView extends BookRow {
  percent: number
}

async function loadBooks(): Promise<BookView[]> {
  const rows = await listBooks()
  return Promise.all(
    rows.map(async (row) => {
      const progress = await getProgress(row.id)
      return {
        ...row,
        percent: progress ? progressPercent(row.charCount, progress.charOffset) : 0,
      }
    }),
  )
}

export default function Library({ onOpen }: LibraryProps) {
  const [books, setBooks] = useState<BookView[]>([])
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  async function refresh() {
    setBooks(await loadBooks())
  }

  useEffect(() => {
    let cancelled = false
    void (async () => {
      const list = await loadBooks()
      if (!cancelled) {
        setBooks(list)
        setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  async function handleFiles(files: File[] | FileList) {
    const txtFiles = Array.from(files).filter((file) => /\.txt$/i.test(file.name))
    if (txtFiles.length === 0) {
      setError('只支持 .txt 格式的文件')
      return
    }

    setBusy(true)
    setError(null)
    try {
      for (const file of txtFiles) {
        await importTxtFile(file)
      }
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : '导入失败')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(bookId: string) {
    await deleteBook(bookId)
    await refresh()
  }

  return (
    <div
      className={`app-shell${dragging ? ' is-dragging' : ''}`}
      onDragOver={(event) => {
        event.preventDefault()
        setDragging(true)
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault()
        setDragging(false)
        void handleFiles(event.dataTransfer.files)
      }}
    >
      <header className="topbar">
        <h1 className="brand">
          马克阅读<span className="brand-dot">.</span>
        </h1>
        <button
          className="btn btn-primary"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
        >
          {busy ? '导入中…' : '导入 TXT'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          multiple
          hidden
          onChange={(event) => {
            const files = event.target.files
            if (files && files.length > 0) {
              void handleFiles(files)
            }
            event.target.value = ''
          }}
        />
      </header>

      {error && <p className="banner-error">{error}</p>}

      {loading ? (
        <main className="empty-state">
          <p className="empty-hint">正在加载书架…</p>
        </main>
      ) : books.length === 0 ? (
        <main className="empty-state">
          <div className="empty-icon" aria-hidden="true">
            📖
          </div>
          <p className="empty-title">书架还是空的</p>
          <p className="empty-hint">点击右上角「导入 TXT」，或直接把文件拖进来</p>
        </main>
      ) : (
        <main className="shelf">
          {books.map((book) => (
            <article
              key={book.id}
              className="book-card"
              onClick={() => onOpen(book.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') onOpen(book.id)
              }}
              role="button"
              tabIndex={0}
            >
              <div className="book-cover" aria-hidden="true">
                TXT
              </div>
              <div className="book-info">
                <h2 className="book-title" title={book.title}>
                  {book.title}
                </h2>
                <p className="book-meta">
                  {Math.max(1, Math.round(book.size / 1024))} KB ·{' '}
                  {book.charCount.toLocaleString()} 字
                </p>
                <div className="book-progress">
                  <div className="book-progress-bar" style={{ width: `${book.percent}%` }} />
                </div>
                <p className="book-progress-text">已读 {book.percent}%</p>
              </div>
              <button
                type="button"
                className="btn-icon"
                aria-label={`删除 ${book.title}`}
                onClick={(event) => {
                  event.stopPropagation()
                  void handleDelete(book.id)
                }}
              >
                ✕
              </button>
            </article>
          ))}
        </main>
      )}
    </div>
  )
}
