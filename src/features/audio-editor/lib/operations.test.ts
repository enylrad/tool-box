import { describe, expect, it } from 'vitest'
import { frameCount, type AudioData } from './audioData'
import { applyOperation, canDeleteSelection, cursorAfter, hasSelection } from './operations'

// 10 frames at 10 Hz = 1 second.
const audio: AudioData = { sampleRate: 10, channels: [Float32Array.from({ length: 10 }, (_, i) => i / 10)] }

describe('operations', () => {
  it('detects empty and full selections', () => {
    expect(hasSelection(audio, null)).toBe(false)
    expect(hasSelection(audio, { start: 0.5, end: 0.5 })).toBe(false)
    expect(hasSelection(audio, { start: 0.2, end: 0.5 })).toBe(true)
    expect(canDeleteSelection(audio, { start: 0, end: 1 })).toBe(false)
    expect(canDeleteSelection(audio, { start: 0, end: 0.5 })).toBe(true)
  })

  it('trims and deletes only with a selection', () => {
    expect(applyOperation(audio, null, { type: 'trim' })).toBe(audio)
    expect(applyOperation(audio, null, { type: 'delete' })).toBe(audio)
    expect(frameCount(applyOperation(audio, { start: 0.2, end: 0.5 }, { type: 'trim' }))).toBe(3)
    expect(frameCount(applyOperation(audio, { start: 0.2, end: 0.5 }, { type: 'delete' }))).toBe(7)
  })

  it('never deletes everything', () => {
    expect(applyOperation(audio, { start: 0, end: 1 }, { type: 'delete' })).toBe(audio)
  })

  it('applies range edits to the whole audio without a selection', () => {
    const result = applyOperation(audio, null, { type: 'silence' })
    expect(Array.from(result.channels[0]).every((sample) => sample === 0)).toBe(true)
  })

  it('applies range edits only to the selection', () => {
    const result = applyOperation(audio, { start: 0.8, end: 1 }, { type: 'silence' })
    expect(result.channels[0][7]).toBeCloseTo(0.7)
    expect(result.channels[0][8]).toBe(0)
  })

  it('moves the cursor after timeline edits', () => {
    const before = { selection: { start: 0.6, end: 0.3 }, position: 0.9 }
    const deleted = applyOperation(audio, before.selection, { type: 'delete' })
    expect(cursorAfter({ type: 'delete' }, before, deleted)).toEqual({ selection: null, position: 0.3 })
    expect(cursorAfter({ type: 'trim' }, before, deleted)).toEqual({ selection: null, position: 0 })
    expect(cursorAfter({ type: 'fadeIn' }, before, deleted)).toEqual({ selection: before.selection, position: 0.7 })
  })
})
