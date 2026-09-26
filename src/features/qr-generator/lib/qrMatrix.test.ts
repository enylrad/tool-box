import { describe, expect, it } from 'vitest'
import { createQrMatrix, finderOrigins, isFinderModule, QrTooLongError } from './qrMatrix'

describe('createQrMatrix', () => {
  it('creates a version 1 symbol for short text', () => {
    const matrix = createQrMatrix('hello', 'M')
    expect(matrix.version).toBe(1)
    expect(matrix.size).toBe(21)
  })

  it('grows with content and error correction', () => {
    const low = createQrMatrix('x'.repeat(100), 'L')
    const high = createQrMatrix('x'.repeat(100), 'H')
    expect(high.size).toBeGreaterThan(low.size)
    expect(high.size).toBe(high.version * 4 + 17)
  })

  it('has finder patterns in three corners', () => {
    const matrix = createQrMatrix('finder', 'M')
    for (const [row, col] of finderOrigins(matrix.size)) {
      expect(matrix.isDark(row, col)).toBe(true)
      expect(matrix.isDark(row + 1, col + 1)).toBe(false)
      expect(matrix.isDark(row + 3, col + 3)).toBe(true)
    }
    expect(isFinderModule(matrix.size, matrix.size - 1, matrix.size - 1)).toBe(false)
  })

  it('throws a dedicated error when the content does not fit', () => {
    expect(() => createQrMatrix('x'.repeat(5000), 'H')).toThrow(QrTooLongError)
  })
})
