import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import App from '../src/App'

describe('App', () => {
  it('渲染书架页与空态提示', () => {
    render(<App />)
    expect(screen.getByRole('heading', { name: /马克阅读/ })).toBeInTheDocument()
    expect(screen.getByText('书架还是空的')).toBeInTheDocument()
  })

  it('导入按钮在 M1 阶段禁用', () => {
    render(<App />)
    expect(screen.getByRole('button', { name: '导入 TXT' })).toBeDisabled()
  })
})
