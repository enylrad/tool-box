import { describe, expect, it } from 'vitest'
import { sampleIndices } from './downsample'

const points = (count: number, segmentBreak = -1) =>
  Array.from({ length: count }, (_, index) => ({ distance: index, segment: segmentBreak >= 0 && index >= segmentBreak ? 1 : 0 }))

describe('sampleIndices', () => {
  it('keeps everything when under the limit', () => {
    expect(sampleIndices(points(5), 10)).toEqual([0, 1, 2, 3, 4])
  })

  it('reduces long tracks, keeping the ends', () => {
    const indices = sampleIndices(points(10_001), 101)
    expect(indices.length).toBeLessThanOrEqual(102)
    expect(indices[0]).toBe(0)
    expect(indices.at(-1)).toBe(10_000)
  })

  it('keeps the first and last point of each segment', () => {
    const indices = sampleIndices(points(1000, 503), 10)
    expect(indices).toContain(502)
    expect(indices).toContain(503)
  })
})
