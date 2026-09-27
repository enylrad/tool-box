import { describe, expect, it } from 'vitest'
import { computeSplits, splitLengthFor } from './splits'
import type { AnalyzedPoint } from './trackAnalysis'

function line(count: number, spacing: number, eleAt: (index: number) => number | null, timeAt: (index: number) => number | null): AnalyzedPoint[] {
  return Array.from({ length: count }, (_, index) => ({
    lat: 0,
    lon: 0,
    x: 0,
    y: 0,
    ele: eleAt(index),
    smoothEle: eleAt(index),
    distance: index * spacing,
    grade: 0,
    time: timeAt(index),
    segment: 0,
  }))
}

describe('splitLengthFor', () => {
  it('uses longer splits for longer tracks', () => {
    expect(splitLengthFor(21_000)).toBe(1000)
    expect(splitLengthFor(120_000)).toBe(5000)
    expect(splitLengthFor(800_000)).toBe(10_000)
  })
})

describe('computeSplits', () => {
  it('splits every kilometer with a shorter last split', () => {
    // 2.5 km, climbing 1 m every 100 m, 30 s per 100 m.
    const points = line(26, 100, (index) => index, (index) => index * 30_000)
    const splits = computeSplits(points, 1000)
    expect(splits.map((split) => split.length)).toEqual([1000, 1000, 500])
    expect(splits.map((split) => split.gain)).toEqual([10, 10, 5])
    expect(splits.map((split) => split.loss)).toEqual([0, 0, 0])
    expect(splits.map((split) => split.duration)).toEqual([300_000, 300_000, 150_000])
  })

  it('interpolates at boundaries between points', () => {
    const points = line(3, 700, (index) => [0, 70, 0][index], () => null)
    const splits = computeSplits(points, 1000)
    expect(splits[0].gain).toBeCloseTo(70)
    expect(splits[0].loss).toBeCloseTo(30)
    expect(splits[1].loss).toBeCloseTo(40)
    expect(splits[0].duration).toBeNull()
  })

  it('reports no elevation when the track has none', () => {
    expect(computeSplits(line(3, 600, () => null, () => null), 1000)[0].gain).toBeNull()
  })

  it('returns nothing for an empty or zero-length track', () => {
    expect(computeSplits([])).toEqual([])
    expect(computeSplits(line(2, 0, () => 0, () => null))).toEqual([])
  })
})
