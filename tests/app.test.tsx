import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'
import App from '../src/App'
import { db } from '../src/db/schema'
import { importTxtFile } from '../src/db/repo'

beforeEach(async () => {
  await db.books.clear()
  await db.progress.clear()
})

describe('App', () => {
  it('没有书时展示空态与导入入口', async () => {
    render(<App />)

    expect(await screen.findByText('书架还是空的')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: '导入 TXT' })).toBeInTheDocument()
  })

  it('已有书籍时展示书名与阅读进度', async () => {
    await importTxtFile(new File([new Uint8Array([0x61, 0x62])], '测试书.txt'))

    render(<App />)

    expect(await screen.findByText('测试书')).toBeInTheDocument()
    expect(screen.getByText('已读 0%')).toBeInTheDocument()
  })
})
