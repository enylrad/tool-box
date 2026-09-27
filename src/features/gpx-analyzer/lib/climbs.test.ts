import { describe, expect, it } from 'vitest'
import { findClimbs } from './climbs'
import type { AnalyzedPoint } from './trackAnalysis'

/** Points every 10 m following the given smoothed elevations. */
function profile(elevations: number[], segmentBreaks: number[] = []): AnalyzedPoint[] {
  let segment = 0
  return elevations.map((ele, index) => {
    if (segmentBreaks.includes(index)) segment++
    return { lat: 0, lon: 0, x: 0, y: 0, ele, smoothEle: ele, distance: index * 10, grade: 0, time: null, segment }
  })
}

const ramp = (from: number, to: number, steps: number) => Array.from({ length: steps }, (_, index) => from + ((to - from) * index) / steps)

describe('findClimbs', () => {
  it('finds one climb from the lowest to the highest point', () => {
    const points = profile([...ramp(120, 100, 5), ...ramp(100, 200, 100), ...ramp(200, 100, 50), 100])
    const climbs = findClimbs(points)
    expect(climbs).toHaveLength(1)
    expect(climbs[0]).toMatchObject({ startIndex: 5, endIndex: 105, gain: 100, length: 1000 })
    expect(climbs[0].averageGrade).toBeCloseTo(10)
  })

  it('keeps a climb together across a short dip', () => {
    const points = profile([...ramp(0, 60, 30), ...ramp(60, 50, 5), ...ramp(50, 120, 30), 120])
    expect(findClimbs(points)).toHaveLength(1)
  })

  it('splits climbs separated by a real descent', () => {
    const points = profile([...ramp(0, 60, 30), ...ramp(60, 0, 30), ...ramp(0, 80, 30), 80])
    expect(findClimbs(points).map((climb) => Math.round(climb.gain))).toEqual([60, 80])
  })

  it('ignores small bumps and gentle false flats', () => {
    expect(findClimbs(profile([...ramp(0, 20, 20), ...ramp(20, 0, 20)]))).toEqual([])
    // 40 m over 4 km is 1 %.
    expect(findClimbs(profile(ramp(0, 40, 400)))).toEqual([])
  })

  it('returns nothing without elevation', () => {
    expect(findClimbs(profile([0, 1]).map((point) => ({ ...point, smoothEle: null })))).toEqual([])
  })
})
