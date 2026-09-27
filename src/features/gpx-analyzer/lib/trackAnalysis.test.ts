import { describe, expect, it } from 'vitest'
import type { GpxTrack, TrackPoint } from './parseGpx'
import { analyzeTrack, elevationGainLoss, indexAtDistance, nearestIndexAtDistance, smoothOverDistance } from './trackAnalysis'

/** Points going north every ~11.1 m (0.0001°) with the given elevations and one point per second. */
function straightLine(elevations: (number | null)[], withTime = true): TrackPoint[] {
  return elevations.map((ele, index) => ({ lat: 40 + index * 0.0001, lon: -3, ele, time: withTime ? index * 1000 : null }))
}

describe('elevationGainLoss', () => {
  it('adds up real climbs and descents', () => {
    expect(elevationGainLoss([100, 150, 120, 200])).toEqual({ gain: 130, loss: 30 })
  })

  it('ignores noise below the threshold', () => {
    expect(elevationGainLoss([100, 101, 100, 102, 100, 101, 100])).toEqual({ gain: 0, loss: 0 })
  })

  it('still counts a slow steady climb made of tiny steps', () => {
    const elevations = Array.from({ length: 101 }, (_, index) => 100 + index * 0.5)
    expect(elevationGainLoss(elevations).gain).toBe(48)
  })
})

describe('smoothOverDistance', () => {
  it('averages the values within the window', () => {
    expect(smoothOverDistance([0, 10, 0, 10], [0, 10, 20, 30], 20)).toEqual([5, 10 / 3, 20 / 3, 5])
  })
})

describe('indexAtDistance', () => {
  const points = [0, 10, 25, 40].map((distance) => ({ distance }))

  it('finds the first point at or after a distance', () => {
    expect(indexAtDistance(points, 0)).toBe(0)
    expect(indexAtDistance(points, 11)).toBe(2)
    expect(indexAtDistance(points, 100)).toBe(3)
  })

  it('finds the nearest point', () => {
    expect(nearestIndexAtDistance(points, 12)).toBe(1)
    expect(nearestIndexAtDistance(points, 20)).toBe(2)
  })
})

describe('analyzeTrack', () => {
  it('measures distance, elevation, grades and time on a steady climb', () => {
    // 101 points, ~1.11 km, climbing 1 m per point (~9 % grade).
    const track: GpxTrack = { name: 'Climb', segments: [straightLine(Array.from({ length: 101 }, (_, index) => 500 + index))] }
    const { stats, points, hasElevation, hasTime } = analyzeTrack(track)
    expect(hasElevation).toBe(true)
    expect(hasTime).toBe(true)
    expect(stats.distance).toBeCloseTo(1112, -1)
    expect(stats.gain).toBe(99)
    expect(stats.loss).toBe(0)
    expect(stats.minEle).toBe(500)
    expect(stats.maxEle).toBe(600)
    expect(points[50].grade).toBeCloseTo(9, 0)
    expect(stats.maxGrade).toBeCloseTo(9, 0)
    expect(stats.duration).toBe(100_000)
    expect(stats.movingTime).toBe(100_000)
    expect(stats.averageSpeed).toBeCloseTo(11.1, 1)
  })

  it('does not measure distance across the gap between segments', () => {
    const first = straightLine([0, 0, 0])
    const second = straightLine([0, 0, 0]).map((point) => ({ ...point, lon: 5 }))
    const { stats, points } = analyzeTrack({ name: null, segments: [first, second] })
    expect(stats.segmentCount).toBe(2)
    expect(stats.distance).toBeCloseTo(44.5, 0)
    expect(points[3].distance).toBe(points[2].distance)
  })

  it('interpolates missing elevations and handles files without any', () => {
    const { points } = analyzeTrack({ name: null, segments: [straightLine([100, null, 120])] })
    expect(points[1].ele).toBeCloseTo(110)

    const flat = analyzeTrack({ name: null, segments: [straightLine([null, null], false)] })
    expect(flat.hasElevation).toBe(false)
    expect(flat.hasTime).toBe(false)
    expect(flat.stats.gain).toBeNull()
    expect(flat.stats.duration).toBeNull()
    expect(flat.points[0].ele).toBeNull()
  })

  it('excludes stops from the moving time', () => {
    const points = straightLine([0, 0, 0, 0])
    // Wait 10 minutes at the second point.
    points[2] = { ...points[1], time: 601_000 }
    points[3] = { ...points[3], time: 602_000 }
    const { stats } = analyzeTrack({ name: null, segments: [points] })
    expect(stats.duration).toBe(602_000)
    expect(stats.movingTime).toBe(2000)
  })

  it('centers the projected coordinates on the track', () => {
    const { bounds } = analyzeTrack({ name: null, segments: [straightLine([0, 0, 0])] })
    expect(bounds.minY).toBeCloseTo(-bounds.maxY)
    expect(bounds.minX).toBeCloseTo(0)
  })
})
