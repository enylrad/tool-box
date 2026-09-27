import { describe, expect, it } from 'vitest'
import { formatAperture, formatAspectRatio, formatExifDate, formatExposureBias, formatShutterSpeed } from './formatValues'

describe('formatShutterSpeed', () => {
  it('uses fractions for fast speeds and seconds for slow ones', () => {
    expect(formatShutterSpeed(1 / 250)).toBe('1/250 s')
    expect(formatShutterSpeed(0.004)).toBe('1/250 s')
    expect(formatShutterSpeed(0.5)).toBe('0.5 s')
    expect(formatShutterSpeed(30)).toBe('30 s')
  })
})

describe('camera values', () => {
  it('formats aperture and exposure compensation', () => {
    expect(formatAperture(1.85)).toBe('f/1.9')
    expect(formatAperture(8)).toBe('f/8')
    expect(formatExposureBias(-2 / 3)).toBe('-0.7 EV')
    expect(formatExposureBias(1)).toBe('+1 EV')
    expect(formatExposureBias(0)).toBe('0 EV')
  })
})

describe('formatAspectRatio', () => {
  it('reduces exact ratios and approximates the rest', () => {
    expect(formatAspectRatio(4000, 3000)).toBe('4:3')
    expect(formatAspectRatio(3000, 4000)).toBe('3:4')
    expect(formatAspectRatio(1920, 1080)).toBe('16:9')
    expect(formatAspectRatio(4080, 3072)).toBe('4:3')
    expect(formatAspectRatio(1234, 500)).toBe('2.47:1')
  })
})

describe('formatExifDate', () => {
  it('adds the time zone and sub-seconds when known', () => {
    expect(formatExifDate('2025:07:31 18:32:10')).toBe('2025-07-31 18:32:10')
    expect(formatExifDate('2025:07:31 18:32:10', '+02:00', '123')).toBe('2025-07-31 18:32:10.123 (UTC+02:00)')
    expect(formatExifDate('2025-08-01T10:00:00+02:00')).toBe('2025-08-01 10:00:00 (UTC+02:00)')
    expect(formatExifDate('not a date')).toBe('not a date')
  })
})
