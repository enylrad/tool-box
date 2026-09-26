import { describe, expect, it } from 'vitest'
import { describeProgress } from './ocrProgress'

describe('describeProgress', () => {
  it('maps known statuses to readable labels', () => {
    expect(describeProgress({ status: 'recognizing text', progress: 0.426 })).toEqual({
      label: 'Recognizing text…',
      percent: 43,
    })
  })

  it('capitalizes unknown statuses', () => {
    expect(describeProgress({ status: 'doing something', progress: 1 }).label).toBe('Doing something…')
  })

  it('clamps invalid progress values', () => {
    expect(describeProgress({ status: 'recognizing text', progress: 1.5 }).percent).toBe(100)
    expect(describeProgress({ status: 'recognizing text', progress: -1 }).percent).toBe(0)
    expect(describeProgress({ status: 'recognizing text', progress: Number.NaN }).percent).toBe(0)
  })
})
