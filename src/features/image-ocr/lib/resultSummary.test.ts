import { describe, expect, it } from 'vitest'
import { describeResult, type ExtractionResult } from './resultSummary'

const result = (overrides: Partial<ExtractionResult>): ExtractionResult => ({
  text: '',
  source: 'pdf',
  pageCount: 1,
  ocrPageCount: 0,
  confidence: null,
  ...overrides,
})

describe('describeResult', () => {
  it('shows the confidence for images', () => {
    expect(describeResult(result({ source: 'image', ocrPageCount: 1, confidence: 94.6 }))).toBe('Done · 95% confidence')
  })

  it('describes PDFs read from embedded text', () => {
    expect(describeResult(result({ pageCount: 3 }))).toBe('Done · 3 pages · embedded text')
  })

  it('describes fully scanned PDFs', () => {
    expect(describeResult(result({ pageCount: 1, ocrPageCount: 1, confidence: 88 }))).toBe('Done · 1 page · OCR, 88% confidence')
  })

  it('describes mixed PDFs', () => {
    expect(describeResult(result({ pageCount: 12, ocrPageCount: 3, confidence: 91.2 }))).toBe(
      'Done · 12 pages · 3 with OCR, 91% confidence',
    )
  })
})
