import { describe, expect, it } from 'vitest'
import { durationOf, targetRange, toFrameRange, type AudioData } from './audioData'

const audio: AudioData = { sampleRate: 100, channels: [new Float32Array(250)] }

describe('audioData', () => {
  it('computes the duration', () => {
    expect(durationOf(audio)).toBe(2.5)
  })

  it('converts, orders and clamps time ranges', () => {
    expect(toFrameRange(audio, { start: 0.5, end: 1 })).toEqual({ start: 50, end: 100 })
    expect(toFrameRange(audio, { start: 2, end: 0.1 })).toEqual({ start: 10, end: 200 })
    expect(toFrameRange(audio, { start: -1, end: 9 })).toEqual({ start: 0, end: 250 })
  })

  it('targets the whole audio when the selection is missing or empty', () => {
    expect(targetRange(audio, null)).toEqual({ start: 0, end: 250 })
    expect(targetRange(audio, { start: 1, end: 1 })).toEqual({ start: 0, end: 250 })
    expect(targetRange(audio, { start: 1, end: 2 })).toEqual({ start: 100, end: 200 })
  })
})
