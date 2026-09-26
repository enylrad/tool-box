import { describe, expect, it } from 'vitest'
import { hasUsableText, joinPages, ocrRenderScale, textContentToString } from './pdfText'

describe('textContentToString', () => {
  it('joins items and honors line breaks', () => {
    const items = [
      { str: 'Hello', hasEOL: false },
      { str: ' ', hasEOL: false },
      { str: 'world  ', hasEOL: true },
      { type: 'beginMarkedContent' },
      { str: 'Second line', hasEOL: true },
    ]
    expect(textContentToString(items)).toBe('Hello world\nSecond line')
  })

  it('collapses runs of blank lines', () => {
    const items = [
      { str: 'A', hasEOL: true },
      { str: '', hasEOL: true },
      { str: '', hasEOL: true },
      { str: '', hasEOL: true },
      { str: 'B', hasEOL: false },
    ]
    expect(textContentToString(items)).toBe('A\n\nB')
  })
})

describe('hasUsableText', () => {
  it('rejects pages with only a page number or stamp', () => {
    expect(hasUsableText('')).toBe(false)
    expect(hasUsableText('  12  ')).toBe(false)
    expect(hasUsableText('CONFIDENTIAL')).toBe(false)
  })

  it('accepts pages with real text in any script', () => {
    expect(hasUsableText('The quick brown fox jumps over the lazy dog')).toBe(true)
    expect(hasUsableText('Añadir señales de tráfico en la ciudad')).toBe(true)
  })
})

describe('joinPages', () => {
  it('returns a single page as is', () => {
    expect(joinPages(['Only page'])).toBe('Only page')
  })

  it('adds a header before every page', () => {
    expect(joinPages(['First', '', 'Third'])).toBe(
      '--- Page 1 ---\n\nFirst\n\n--- Page 2 ---\n\n--- Page 3 ---\n\nThird',
    )
  })
})

describe('ocrRenderScale', () => {
  it('renders normal pages at 3×', () => {
    expect(ocrRenderScale(595, 842)).toBe(3)
  })

  it('limits the size of very large pages', () => {
    expect(ocrRenderScale(2000, 3000) * 3000).toBeCloseTo(4000)
  })
})
