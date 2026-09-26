import { describe, expect, it } from 'vitest'
import { estimateSeconds, formatDuration } from './readingTime'

describe('estimateSeconds', () => {
  it('converts words to seconds, rounding up', () => {
    expect(estimateSeconds(230, 230)).toBe(60)
    expect(estimateSeconds(1, 230)).toBe(1)
  })

  it('returns 0 for no words or an invalid speed', () => {
    expect(estimateSeconds(0, 230)).toBe(0)
    expect(estimateSeconds(100, 0)).toBe(0)
  })
})

describe('formatDuration', () => {
  it('shows seconds under a minute', () => {
    expect(formatDuration(0)).toBe('0 s')
    expect(formatDuration(45)).toBe('45 s')
  })

  it('shows minutes and seconds', () => {
    expect(formatDuration(60)).toBe('1 min')
    expect(formatDuration(200)).toBe('3 min 20 s')
  })

  it('shows hours and minutes for long texts', () => {
    expect(formatDuration(3600)).toBe('1 h')
    expect(formatDuration(3930)).toBe('1 h 5 min')
  })
})
