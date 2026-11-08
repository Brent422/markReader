export default function Library() {
  return (
    <div className="app-shell">
      <header className="topbar">
        <h1 className="brand">
          马克阅读<span className="brand-dot">.</span>
        </h1>
        <button className="btn btn-primary" disabled title="M2 阶段实现导入功能">
          导入 TXT
        </button>
      </header>

      <main className="empty-state">
        <div className="empty-icon" aria-hidden="true">
          📖
        </div>
        <p className="empty-title">书架还是空的</p>
        <p className="empty-hint">下一步将支持导入本地 .txt 文件</p>
        <p className="empty-meta">M1 骨架已完成 · 阅读器本体开发中</p>
      </main>
    </div>
  )
}
