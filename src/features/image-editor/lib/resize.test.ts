import { describe, expect, it } from 'vitest'
import { DEFAULT_RESIZE, MAX_SIDE, clampInteger, computeOutputSize, fitInside, limitSize, presetRatio } from './resize'

const source = { width: 4000, height: 3000 }

describe('computeOutputSize', () => {
  it('keeps the cropped size in original mode', () => {
    expect(computeOutputSize(source, { ...DEFAULT_RESIZE, mode: 'original' })).toEqual(source)
  })

  it('scales by a percentage, including upscaling', () => {
    expect(computeOutputSize(source, { ...DEFAULT_RESIZE, mode: 'percent', percent: 25 })).toEqual({ width: 1000, height: 750 })
    expect(computeOutputSize({ width: 101, height: 51 }, { ...DEFAULT_RESIZE, mode: 'percent', percent: 150 })).toEqual({
      width: 152,
      height: 77,
    })
  })

  it('never goes below one pixel', () => {
    expect(computeOutputSize({ width: 40, height: 10 }, { ...DEFAULT_RESIZE, mode: 'percent', percent: 1 })).toEqual({
      width: 1,
      height: 1,
    })
  })

  it('fits inside the custom box when keeping the aspect ratio', () => {
    const settings = { ...DEFAULT_RESIZE, mode: 'custom' as const, width: 1920, height: 1080, keepAspect: true }
    expect(computeOutputSize(source, settings)).toEqual({ width: 1440, height: 1080 })
    expect(computeOutputSize({ width: 1000, height: 4000 }, settings)).toEqual({ width: 270, height: 1080 })
  })

  it('stretches to the exact custom size otherwise', () => {
    const settings = { ...DEFAULT_RESIZE, mode: 'custom' as const, width: 800, height: 800, keepAspect: false }
    expect(computeOutputSize(source, settings)).toEqual({ width: 800, height: 800 })
  })
})

describe('limitSize', () => {
  it('keeps sizes a canvas can hold', () => {
    expect(limitSize({ width: 2000, height: 1000 })).toEqual({ width: 2000, height: 1000 })
  })

  it('shrinks long sides and huge areas, keeping the proportions', () => {
    expect(limitSize({ width: 40000, height: 1000 })).toEqual({ width: MAX_SIDE, height: 410 })
    const { width, height } = limitSize({ width: 16000, height: 16000 })
    expect(width).toBe(height)
    expect(width * height).toBeLessThanOrEqual(100_000_000)
  })
})

describe('clampInteger', () => {
  it('rounds and clamps valid numbers and falls back otherwise', () => {
    expect(clampInteger(12.6, 1, 10, 5)).toBe(10)
    expect(clampInteger(-3, 1, 10, 5)).toBe(1)
    expect(clampInteger('7', 1, 10, 5)).toBe(5)
    expect(clampInteger(Number.NaN, 1, 10, 5)).toBe(5)
  })
})

describe('presetRatio', () => {
  it('resolves fixed, free and original presets', () => {
    expect(presetRatio('16:9', source)).toBeCloseTo(16 / 9)
    expect(presetRatio('free', source)).toBeNull()
    expect(presetRatio('original', source)).toBeCloseTo(4 / 3)
    expect(presetRatio('unknown', source)).toBeNull()
  })
})

describe('fitInside', () => {
  it('scales up or down to the limiting side', () => {
    expect(fitInside({ width: 4000, height: 3000 }, { width: 800, height: 800 })).toEqual({ width: 800, height: 600 })
    expect(fitInside({ width: 100, height: 200 }, { width: 800, height: 800 })).toEqual({ width: 400, height: 800 })
  })

  it('returns an empty size while the box is not measured', () => {
    expect(fitInside({ width: 100, height: 100 }, { width: 0, height: 0 })).toEqual({ width: 0, height: 0 })
  })
})
