import { describe, expect, it } from 'vitest'
import { formatDistance, formatDuration, formatElevation, formatGrade, formatPace, formatSpeed } from './format'

describe('format', () => {
  it('formats distances in meters or kilometers', () => {
    expect(formatDistance(850.4)).toBe('850 m')
    expect(formatDistance(4250)).toBe('4.25 km')
    expect(formatDistance(123_456)).toBe('123.5 km')
  })

  it('formats elevations and grades', () => {
    expect(formatElevation(1234.4)).toBe('1,234 m')
    expect(formatElevation(null)).toBe('—')
    expect(formatGrade(8.46)).toBe('+8.5 %')
    expect(formatGrade(-3)).toBe('−3.0 %')
    expect(formatGrade(0.01)).toBe('0.0 %')
  })

  it('formats durations, speeds and paces', () => {
    expect(formatDuration(3_725_000)).toBe('1:02:05')
    expect(formatDuration(null)).toBe('—')
    expect(formatSpeed(10)).toBe('36.0 km/h')
    expect(formatPace(1000 / 324)).toBe('5:24 /km')
    expect(formatPace(0)).toBe('—')
  })
})
