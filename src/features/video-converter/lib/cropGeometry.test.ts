import { describe, expect, it } from 'vitest'
import { outputSize, rotate, toEvenCrop, IDENTITY_TRANSFORM } from './cropGeometry'

const frame = { width: 1920, height: 1080 }

describe('rotate', () => {
  it('wraps around in both directions', () => {
    expect(rotate(270, 90)).toBe(0)
    expect(rotate(0, -90)).toBe(270)
    expect(rotate(90, 180)).toBe(270)
  })
})

describe('toEvenCrop', () => {
  it('rounds the size down to even numbers', () => {
    expect(toEvenCrop({ x: 3, y: 5, width: 101, height: 99 })).toEqual({ x: 3, y: 5, width: 100, height: 98 })
  })
})

describe('outputSize', () => {
  it('uses the crop and swaps sides for quarter turns', () => {
    const crop = { x: 0, y: 0, width: 400, height: 300 }
    expect(outputSize(frame, IDENTITY_TRANSFORM)).toEqual(frame)
    expect(outputSize(frame, { ...IDENTITY_TRANSFORM, crop })).toEqual({ width: 400, height: 300 })
    expect(outputSize(frame, { ...IDENTITY_TRANSFORM, crop, rotation: 90 })).toEqual({ width: 300, height: 400 })
    expect(outputSize(frame, { ...IDENTITY_TRANSFORM, rotation: 180 })).toEqual(frame)
  })
})
