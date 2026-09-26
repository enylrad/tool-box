import { describe, expect, it } from 'vitest'
import { formatBytes, formatTime, parseTime } from './formatTime'

describe('formatTime', () => {
  it('formats minutes, seconds and milliseconds', () => {
    expect(formatTime(0)).toBe('0:00.000')
    expect(formatTime(83.5)).toBe('1:23.500')
    expect(formatTime(3723.004)).toBe('1:02:03.004')
  })

  it('treats invalid values as zero', () => {
    expect(formatTime(Number.NaN)).toBe('0:00.000')
    expect(formatTime(-3)).toBe('0:00.000')
  })
})

describe('parseTime', () => {
  it('parses plain seconds and colon notation', () => {
    expect(parseTime('83.5')).toBe(83.5)
    expect(parseTime('83,5')).toBe(83.5)
    expect(parseTime('1:23.5')).toBe(83.5)
    expect(parseTime(' 1:02:03 ')).toBe(3723)
    expect(parseTime('.5')).toBe(0.5)
  })

  it('rejects invalid text', () => {
    expect(parseTime('')).toBeNull()
    expect(parseTime('abc')).toBeNull()
    expect(parseTime('-1')).toBeNull()
    expect(parseTime('1.5:20')).toBeNull()
    expect(parseTime('1:2:3:4')).toBeNull()
  })

  it('round-trips with formatTime', () => {
    expect(parseTime(formatTime(754.321))).toBeCloseTo(754.321)
  })
})

describe('formatBytes', () => {
  it('uses readable units', () => {
    expect(formatBytes(512)).toBe('512 B')
    expect(formatBytes(1536)).toBe('1.5 KB')
    expect(formatBytes(25 * 1024 * 1024)).toBe('25 MB')
  })
})
