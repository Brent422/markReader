# 马克阅读

本地优先的 TXT 阅读器。导入本地 `.txt` 文件，上下滚动阅读，关闭后自动回到上次读到的位置。

无需账号，无需服务器，所有数据保存在浏览器本地（IndexedDB）。

## 功能

- **导入 TXT**：点击按钮或直接拖入文件，自动识别 UTF-8 / GBK 编码
- **书架**：展示书名、大小、字数与已读百分比
- **滚动阅读**：整本连续滚动，保留原始换行与段落
- **进度记忆**：按全文字符偏移记录位置，关掉重开接着读

## 明确不做（当前版本）

EPUB / PDF、目录章节、划线笔记、书签、主题切换、字号调节、云同步、账号体系。

## 文档

- [产品设计文档](docs/product-design.md) — 定位、范围、功能规格、技术方案、已知风险与规划

## 技术栈

| 层 | 选型 |
| --- | --- |
| 构建 | Vite 8 + React 19 + TypeScript |
| 存储 | Dexie（IndexedDB 封装） |
| 测试 | Vitest + Testing Library + fake-indexeddb |

## 开发

```bash
npm install
npm run dev       # http://localhost:5173
npm test          # 单元测试
npm run build     # 类型检查 + 生产构建
```

## 目录结构

```text
src/
├─ core/txt.ts       编码识别、解码、进度换算（纯函数）
├─ db/schema.ts      Dexie 表结构：books / progress
├─ db/repo.ts        数据访问：导入、列表、删除、进度读写
├─ pages/Library.tsx 书架页（导入、列表、删除）
├─ pages/Reader.tsx  阅读页（滚动渲染 + 进度保存/恢复）
├─ App.tsx           书架 ↔ 阅读页切换
└─ main.tsx
tests/
├─ txt.test.ts       解析与进度换算单测
├─ repo.test.ts      数据层单测（需 fake-indexeddb）
└─ app.test.tsx      书架页渲染测试
```

## 设计要点

- **进度以全文字符偏移记录**（`charOffset`），不依赖页码或滚动像素，窗口尺寸变化后依然准确。
- **编码识别**：先严格按 UTF-8 解码，失败则回退 GB18030，覆盖绝大多数中文 TXT。
- **保存时机**：滚动停止 400ms 后落库，离开阅读页时再兜底保存一次。
- **数据版本**：Dexie 从 v1 升级到 v2，移除了早期的 `annotations` 表与章节进度字段。
