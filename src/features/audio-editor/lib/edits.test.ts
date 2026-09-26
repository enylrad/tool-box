import { describe, expect, it } from 'vitest'
import type { AudioData } from './audioData'
import { applyGain, deleteRange, fadeIn, fadeOut, normalize, peakLevel, reverse, silence, toMono, trim } from './edits'

function audio(...channels: number[][]): AudioData {
  return { sampleRate: 10, channels: channels.map((samples) => Float32Array.from(samples)) }
}

function values(data: AudioData): number[][] {
  return data.channels.map((samples) => Array.from(samples, (value) => Math.round(value * 1000) / 1000))
}

describe('edits', () => {
  const stereo = audio([0.1, 0.2, 0.3, 0.4, 0.5], [-0.1, -0.2, -0.3, -0.4, -0.5])

  it('trims to a range', () => {
    expect(values(trim(stereo, { start: 1, end: 3 }))).toEqual([
      [0.2, 0.3],
      [-0.2, -0.3],
    ])
  })

  it('deletes a range', () => {
    expect(values(deleteRange(stereo, { start: 1, end: 4 }))).toEqual([
      [0.1, 0.5],
      [-0.1, -0.5],
    ])
  })

  it('silences a range', () => {
    expect(values(silence(stereo, { start: 0, end: 2 }))[0]).toEqual([0, 0, 0.3, 0.4, 0.5])
  })

  it('fades in and out linearly', () => {
    const flat = audio([1, 1, 1, 1, 1])
    expect(values(fadeIn(flat, { start: 0, end: 5 }))[0]).toEqual([0, 0.25, 0.5, 0.75, 1])
    expect(values(fadeOut(flat, { start: 2, end: 5 }))[0]).toEqual([1, 1, 1, 0.5, 0])
  })

  it('applies gain in decibels and clips', () => {
    const result = values(applyGain(audio([0.1, 0.9]), { start: 0, end: 2 }, 6.0206))
    expect(result[0]).toEqual([0.2, 1])
  })

  it('normalizes the peak to the target level', () => {
    const result = normalize(audio([0.25, -0.5]), { start: 0, end: 2 }, 0)
    expect(values(result)[0]).toEqual([0.5, -1])
    expect(peakLevel(result, { start: 0, end: 2 })).toBeCloseTo(1)
  })

  it('leaves silence unchanged when normalizing', () => {
    const quiet = audio([0, 0])
    expect(normalize(quiet, { start: 0, end: 2 })).toBe(quiet)
  })

  it('reverses only the range', () => {
    expect(values(reverse(stereo, { start: 0, end: 3 }))[0]).toEqual([0.3, 0.2, 0.1, 0.4, 0.5])
  })

  it('mixes channels to mono', () => {
    expect(values(toMono(audio([1, 0.5], [0, -0.5])))).toEqual([[0.5, 0]])
  })

  it('never mutates its input', () => {
    const before = values(stereo)
    fadeIn(stereo, { start: 0, end: 5 })
    reverse(stereo, { start: 0, end: 5 })
    applyGain(stereo, { start: 0, end: 5 }, 12)
    expect(values(stereo)).toEqual(before)
  })
})
