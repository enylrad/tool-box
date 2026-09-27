import { describe, expect, it } from 'vitest'
import { randomInt, shuffle, type RandomSource } from './secureRandom'

/** A random source that returns the given values in order. */
function sequence(...values: number[]): RandomSource {
  let index = 0
  return (array) => {
    for (let i = 0; i < array.length; i++) array[i] = values[index++]
  }
}

describe('randomInt', () => {
  it('reduces the random value into the range', () => {
    expect(randomInt(10, sequence(1234))).toBe(4)
  })

  it('rejects values that would introduce modulo bias', () => {
    // 2^32 % 3 = 1, so the largest 32-bit value is rejected and the next one is used.
    expect(randomInt(3, sequence(2 ** 32 - 1, 5))).toBe(2)
  })

  it('always returns 0 for a range of one', () => {
    expect(randomInt(1)).toBe(0)
  })

  it('stays in range and covers every value with the real random source', () => {
    const seen = new Set<number>()
    for (let i = 0; i < 2000; i++) {
      const value = randomInt(7)
      expect(value).toBeGreaterThanOrEqual(0)
      expect(value).toBeLessThan(7)
      seen.add(value)
    }
    expect(seen.size).toBe(7)
  })

  it('rejects invalid ranges', () => {
    expect(() => randomInt(0)).toThrow(RangeError)
    expect(() => randomInt(2.5)).toThrow(RangeError)
  })
})

describe('shuffle', () => {
  it('keeps the same elements', () => {
    const items = [1, 2, 3, 4, 5, 6]
    expect(shuffle([...items]).sort()).toEqual(items)
  })

  it('swaps using the random source', () => {
    // i=2 → j=0, i=1 → j=0
    expect(shuffle(['a', 'b', 'c'], sequence(0, 0))).toEqual(['b', 'c', 'a'])
  })
})
