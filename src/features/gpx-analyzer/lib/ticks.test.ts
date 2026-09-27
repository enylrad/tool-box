import { describe, expect, it } from 'vitest'
import { niceTicks } from './ticks'

describe('niceTicks', () => {
  it('returns round values inside the range', () => {
    expect(niceTicks(0, 10, 5)).toEqual([0, 2, 4, 6, 8, 10])
    expect(niceTicks(1183, 1987, 4)).toEqual([1250, 1500, 1750])
    expect(niceTicks(1183, 1987, 6)).toEqual([1200, 1400, 1600, 1800])
    expect(niceTicks(0, 0.7, 3)).toEqual([0, 0.25, 0.5])
  })

  it('handles empty and invalid ranges', () => {
    expect(niceTicks(5, 5)).toEqual([5])
    expect(niceTicks(Number.NaN, 1)).toEqual([])
  })
})
