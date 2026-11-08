interface ReaderProps {
  bookId: string
  onBack: () => void
}

/**
 * 阅读页占位组件。
 * M3 阶段将替换为真正的滚动阅读视图。
 */
export default function Reader({ bookId, onBack }: ReaderProps) {
  return (
    <div className="app-shell">
      <header className="topbar">
        <button className="btn" onClick={onBack}>
          ← 返回书架
        </button>
      </header>
      <main className="empty-state">
        <p className="empty-title">阅读器开发中</p>
        <p className="empty-hint">书籍 ID：{bookId}</p>
      </main>
    </div>
  )
}
