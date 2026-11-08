# 马克阅读

本地优先的 TXT 电子书阅读器。书籍、阅读进度、划线批注全部保存在浏览器本地（IndexedDB），无需账号，无需服务器。

## 技术栈

| 层 | 选型 | 说明 |
| --- | --- | --- |
| 构建 | Vite 8 + React 19 + TypeScript | 纯前端，零后端 |
| 存储 | Dexie（IndexedDB 封装） | 书架、进度、批注 |
| 测试 | Vitest + Testing Library | 核心解析逻辑为纯函数，重点单测 |

## 开发

```bash
npm install
npm run dev       # 开发服务器 http://localhost:5173
npm test          # 单元测试
npm run build     # 类型检查 + 生产构建
```

## 当前进度

- [x] **M1** 项目骨架、书架空态、TXT 解析核心（编码识别 / 章节切分）
- [ ] **M2** TXT 导入与书架列表
- [ ] **M3** 阅读视图（滚动阅读、章节跳转、字号与主题）
- [ ] **M4** 阅读进度持久化
- [ ] **M5** 划线高亮与笔记

## 目录结构

```text
src/
├─ core/txt.ts       编码识别、解码、章节切分（纯函数，已被单测覆盖）
├─ db/schema.ts      Dexie 表结构：books / progress / annotations
├─ pages/Library.tsx 书架页
├─ pages/Reader.tsx  阅读页（M3）
└─ main.tsx App.tsx
tests/
├─ txt.test.ts       解析核心单测
└─ app.test.tsx      书架页渲染测试
```

## 设计要点

- **进度以字符偏移记录**（`chapterIndex` + `charOffset`），不依赖页码，字号与窗口变化后位置依然准确。
- **编码识别**：先严格按 UTF-8 解码，失败则回退 GB18030，覆盖绝大多数中文 TXT。
- **章节切分**：识别 `第X章/节/回/卷/篇`、`序章`、`前言`、`番外一` 等标题行，并按行长度限制避免误判正文。
