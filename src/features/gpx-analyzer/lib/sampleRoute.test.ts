import { describe, expect, it } from 'vitest'
import { findClimbs } from './climbs'
import { parseGpx } from './parseGpx'
import { createSampleGpx } from './sampleRoute'
import { analyzeTrack } from './trackAnalysis'

describe('createSampleGpx', () => {
  it('produces a valid GPX loop with elevation, time and climbs', () => {
    const analysis = analyzeTrack(parseGpx(createSampleGpx()))
    expect(analysis.name).toBe('Sample mountain loop')
    expect(analysis.hasElevation).toBe(true)
    expect(analysis.hasTime).toBe(true)
    expect(analysis.stats.distance / 1000).toBeGreaterThan(10)
    expect(analysis.stats.gain).toBeGreaterThan(800)
    expect(findClimbs(analysis.points).length).toBeGreaterThanOrEqual(2)
  })
})
