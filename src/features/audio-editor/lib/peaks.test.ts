import { describe, expect, it } from 'vitest'
import { computePeaks } from './peaks'

describe('computePeaks', () => {
  it('returns min and max per bucket across channels', () => {
    const audio = {
      sampleRate: 8,
      channels: [Float32Array.from([0.1, -0.2, 0.5, 0.3]), Float32Array.from([-0.4, 0.2, 0, -0.9])],
    }
    const peaks = computePeaks(audio, 2)
    expect(peaks[0].min).toBeCloseTo(-0.4)
    expect(peaks[0].max).toBeCloseTo(0.2)
    expect(peaks[1].min).toBeCloseTo(-0.9)
    expect(peaks[1].max).toBeCloseTo(0.5)
  })

  it('handles more buckets than samples', () => {
    const peaks = computePeaks({ sampleRate: 8, channels: [Float32Array.from([1, -1])] }, 4)
    expect(peaks).toHaveLength(4)
    expect(peaks.map((peak) => peak.max)).toEqual([1, 1, 0, 0])
  })

  it('handles empty audio', () => {
    expect(computePeaks({ sampleRate: 8, channels: [new Float32Array(0)] }, 3)).toEqual([
      { min: 0, max: 0 },
      { min: 0, max: 0 },
      { min: 0, max: 0 },
    ])
  })
})
