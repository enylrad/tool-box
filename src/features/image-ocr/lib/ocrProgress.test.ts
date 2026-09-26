import { describe, expect, it } from 'vitest'
import { describePageProgress, describeProgress } from './ocrProgress'

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

describe('describePageProgress', () => {
  it('prefixes the page and maps progress onto the whole document', () => {
    expect(describePageProgress({ label: 'Recognizing text…', percent: 50 }, 1, 4)).toEqual({
      label: 'Page 2 of 4 · Recognizing text…',
      percent: 38,
    })
  })

  it('leaves single-page progress unchanged', () => {
    const progress = { label: 'Recognizing text…', percent: 40 }
    expect(describePageProgress(progress, 0, 1)).toEqual(progress)
  })
})
