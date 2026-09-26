import { describe, expect, it } from 'vitest'
import { clampTrim, formatTimecode, isTrimmed, parseTimecode, trimmedDuration } from './timecode'

describe('formatTimecode', () => {
  it('formats minutes and tenths of a second', () => {
    expect(formatTimecode(0)).toBe('0:00.0')
    expect(formatTimecode(62.54)).toBe('1:02.5')
  })

  it('carries rounding into the next minute', () => {
    expect(formatTimecode(59.96)).toBe('1:00.0')
  })

  it('adds hours for long videos', () => {
    expect(formatTimecode(3725.2)).toBe('1:02:05.2')
  })

  it('treats invalid values as zero', () => {
    expect(formatTimecode(Number.NaN)).toBe('0:00.0')
    expect(formatTimecode(-5)).toBe('0:00.0')
  })
})

describe('parseTimecode', () => {
  it('accepts seconds, m:ss and h:mm:ss', () => {
    expect(parseTimecode('12.5')).toBe(12.5)
    expect(parseTimecode('1:02.5')).toBe(62.5)
    expect(parseTimecode(' 1:02:03 ')).toBe(3723)
  })

  it('accepts a decimal comma', () => {
    expect(parseTimecode('1:02,5')).toBe(62.5)
  })

  it('round-trips formatted values', () => {
    expect(parseTimecode(formatTimecode(3725.2))).toBeCloseTo(3725.2)
  })

  it('rejects malformed input', () => {
    for (const text of ['', 'abc', '1:', '1:75', '1.5:30', '-3', '1:2:3:4']) {
      expect(parseTimecode(text)).toBeNull()
    }
  })
})

describe('clampTrim', () => {
  it('keeps the range inside the video', () => {
    expect(clampTrim({ start: -2, end: 50 }, 30)).toEqual({ start: 0, end: null })
  })

  it('keeps start before end', () => {
    expect(clampTrim({ start: 20, end: 10 }, 30)).toEqual({ start: 9.9, end: 10 })
  })

  it('leaves the range alone when the duration is unknown', () => {
    expect(clampTrim({ start: 5, end: 8 }, Number.NaN)).toEqual({ start: 5, end: 8 })
  })
})

describe('trimmedDuration / isTrimmed', () => {
  it('measures the clip', () => {
    expect(trimmedDuration({ start: 2, end: null }, 10)).toBe(8)
    expect(trimmedDuration({ start: 2, end: 5 }, null)).toBe(3)
    expect(trimmedDuration({ start: 2, end: null }, null)).toBeNull()
  })

  it('detects whether anything is cut', () => {
    expect(isTrimmed({ start: 0, end: null }, 10)).toBe(false)
    expect(isTrimmed({ start: 0, end: 10 }, 10)).toBe(false)
    expect(isTrimmed({ start: 0, end: 9 }, 10)).toBe(true)
    expect(isTrimmed({ start: 1, end: null }, 10)).toBe(true)
  })
})
