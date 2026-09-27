import { describe, expect, it } from 'vitest'
import { ADAPTIVE_SAFE_ZONE, MASKABLE_SAFE_ZONE, artworkRect, clampPadding, hasBackground, iconShape } from './layout'

describe('artworkRect', () => {
  it('fills the whole icon without padding', () => {
    expect(artworkRect(100, 'standard', 0, 500, 500)).toEqual({ x: 0, y: 0, width: 100, height: 100 })
  })

  it('applies padding on every side', () => {
    expect(artworkRect(100, 'standard', 0.1, 500, 500)).toEqual({ x: 10, y: 10, width: 80, height: 80 })
  })

  it('centers non-square images and keeps their aspect ratio', () => {
    const rect = artworkRect(100, 'opaque', 0, 400, 200)
    expect(rect).toEqual({ x: 0, y: 25, width: 100, height: 50 })
  })

  it('keeps adaptive and maskable artwork inside their safe zones', () => {
    expect(artworkRect(108, 'adaptive-foreground', 0, 10, 10).width).toBeCloseTo(108 * ADAPTIVE_SAFE_ZONE)
    expect(artworkRect(108, 'monochrome', 0, 10, 10).width).toBeCloseTo(66)
    expect(artworkRect(512, 'maskable', 0, 10, 10).width).toBeCloseTo(512 * MASKABLE_SAFE_ZONE)
  })
})

describe('clampPadding', () => {
  it('keeps padding between 0 and 25 %', () => {
    expect(clampPadding(-1)).toBe(0)
    expect(clampPadding(0.5)).toBe(0.25)
    expect(clampPadding(Number.NaN)).toBe(0)
    expect(clampPadding(0.1)).toBe(0.1)
  })
})

describe('hasBackground', () => {
  it('follows the transparency setting only where transparency is allowed', () => {
    expect(hasBackground('standard', true)).toBe(false)
    expect(hasBackground('standard', false)).toBe(true)
    expect(hasBackground('round', false)).toBe(true)
    expect(hasBackground('opaque', true)).toBe(true)
    expect(hasBackground('maskable', true)).toBe(true)
    expect(hasBackground('adaptive-foreground', false)).toBe(false)
    expect(hasBackground('monochrome', false)).toBe(false)
  })
})

describe('iconShape', () => {
  it('uses the chosen shape for standard icons and fixed shapes for the rest', () => {
    expect(iconShape('standard', 'rounded')).toBe('rounded')
    expect(iconShape('round', 'square')).toBe('circle')
    expect(iconShape('opaque', 'circle')).toBe('square')
    expect(iconShape('maskable', 'circle')).toBe('square')
  })
})
