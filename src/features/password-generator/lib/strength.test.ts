import { describe, expect, it } from 'vitest'
import { estimateEntropyBits, getStrength } from './strength'

describe('estimateEntropyBits', () => {
  it('multiplies the length by the bits per character', () => {
    expect(estimateEntropyBits(10, 2)).toBe(10)
    expect(estimateEntropyBits(8, 256)).toBe(64)
  })

  it('is zero when there is no choice', () => {
    expect(estimateEntropyBits(0, 26)).toBe(0)
    expect(estimateEntropyBits(20, 1)).toBe(0)
  })
})

describe('getStrength', () => {
  it.each([
    [0, 'Very weak'],
    [27.9, 'Very weak'],
    [28, 'Weak'],
    [36, 'Fair'],
    [60, 'Strong'],
    [80, 'Very strong'],
    [500, 'Very strong'],
  ])('%d bits is %s', (bits, label) => {
    expect(getStrength(bits).label).toBe(label)
  })
})
