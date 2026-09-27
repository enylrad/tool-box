import { describe, expect, it } from 'vitest'
import { formatCount, formatLength, formatQuantity, formatSize } from './formatStats'

describe('formatStats', () => {
  it('formats counts with thousands separators', () => {
    expect(formatCount(1234567)).toBe('1,234,567')
  })

  it('pluralizes quantities', () => {
    expect(formatQuantity(1, 'triangle')).toBe('1 triangle')
    expect(formatQuantity(1500, 'triangle')).toBe('1,500 triangles')
    expect(formatQuantity(0, 'vertex', 'vertices')).toBe('0 vertices')
  })

  it('formats lengths with three significant digits', () => {
    expect(formatLength(0)).toBe('0')
    expect(formatLength(1.23456)).toBe('1.23')
    expect(formatLength(0.012345)).toBe('0.0123')
    expect(formatLength(1234.5)).toBe('1,235')
  })

  it('formats a bounding box size', () => {
    expect(formatSize({ x: 2, y: 1.5, z: 0.25 })).toBe('2 × 1.5 × 0.25')
  })
})
