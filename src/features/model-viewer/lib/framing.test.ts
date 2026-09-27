import { describe, expect, it } from 'vitest'
import { clipPlanes, fitDistance, gridSizeFor } from './framing'

describe('fitDistance', () => {
  it('fits the sphere in the vertical field of view on wide viewports', () => {
    // A 90° field of view sees a unit sphere from 1 / sin(45°).
    expect(fitDistance(1, 90, 2, 1)).toBeCloseTo(Math.SQRT2)
  })

  it('uses the narrower horizontal field of view on tall viewports', () => {
    expect(fitDistance(1, 90, 0.5, 1)).toBeGreaterThan(fitDistance(1, 90, 1, 1))
  })

  it('scales with the radius and the margin', () => {
    expect(fitDistance(10, 45, 1, 1.2)).toBeCloseTo(fitDistance(1, 45, 1, 1) * 12)
  })
})

describe('clipPlanes', () => {
  it('keeps the whole sphere between the near and far planes', () => {
    const { near, far } = clipPlanes(2, 5)
    expect(near).toBeLessThan(5 - 2)
    expect(far).toBeGreaterThan(5 + 2)
  })
})

describe('gridSizeFor', () => {
  it('rounds up to 1, 2 or 5 times a power of ten', () => {
    expect(gridSizeFor(0.3)).toBeCloseTo(0.5)
    expect(gridSizeFor(1)).toBe(1)
    expect(gridSizeFor(1.5)).toBe(2)
    expect(gridSizeFor(3)).toBe(5)
    expect(gridSizeFor(7)).toBe(10)
    expect(gridSizeFor(1200)).toBe(2000)
  })

  it('falls back to 1 for empty or invalid extents', () => {
    expect(gridSizeFor(0)).toBe(1)
    expect(gridSizeFor(Number.NaN)).toBe(1)
    expect(gridSizeFor(Infinity)).toBe(1)
  })
})
