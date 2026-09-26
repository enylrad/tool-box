import { describe, expect, it } from 'vitest'
import { centeredCrop, clampCrop, dragCrop, outputSize, rotate, toEvenCrop, IDENTITY_TRANSFORM } from './cropGeometry'

const frame = { width: 1920, height: 1080 }

describe('rotate', () => {
  it('wraps around in both directions', () => {
    expect(rotate(270, 90)).toBe(0)
    expect(rotate(0, -90)).toBe(270)
    expect(rotate(90, 180)).toBe(270)
  })
})

describe('clampCrop', () => {
  it('rounds and keeps the rectangle inside the frame', () => {
    expect(clampCrop({ x: 1900.4, y: -10, width: 100.6, height: 2000 }, frame)).toEqual({
      x: 1819,
      y: 0,
      width: 101,
      height: 1080,
    })
  })

  it('enforces a minimum size', () => {
    expect(clampCrop({ x: 0, y: 0, width: 1, height: 1 }, frame)).toMatchObject({ width: 16, height: 16 })
  })
})

describe('toEvenCrop', () => {
  it('rounds the size down to even numbers', () => {
    expect(toEvenCrop({ x: 3, y: 5, width: 101, height: 99 })).toEqual({ x: 3, y: 5, width: 100, height: 98 })
  })
})

describe('centeredCrop', () => {
  it('returns the full frame without an aspect ratio', () => {
    expect(centeredCrop(frame, null)).toEqual({ x: 0, y: 0, ...frame })
  })

  it('fits the largest centred square', () => {
    expect(centeredCrop(frame, 1)).toEqual({ x: 420, y: 0, width: 1080, height: 1080 })
  })

  it('fits a portrait ratio', () => {
    expect(centeredCrop(frame, 9 / 16)).toEqual({ x: 656, y: 0, width: 608, height: 1080 })
  })
})

describe('dragCrop', () => {
  const start = { x: 100, y: 100, width: 400, height: 300 }

  it('moves without leaving the frame', () => {
    expect(dragCrop(start, 'move', 50, 20, frame, null)).toEqual({ ...start, x: 150, y: 120 })
    expect(dragCrop(start, 'move', -500, 5000, frame, null)).toEqual({ ...start, x: 0, y: 780 })
  })

  it('resizes from the bottom-right corner', () => {
    expect(dragCrop(start, 'se', 100, 50, frame, null)).toEqual({ x: 100, y: 100, width: 500, height: 350 })
  })

  it('resizes from the top-left corner around the opposite corner', () => {
    expect(dragCrop(start, 'nw', 100, 50, frame, null)).toEqual({ x: 200, y: 150, width: 300, height: 250 })
  })

  it('stops at the frame edge', () => {
    expect(dragCrop(start, 'nw', -1000, -1000, frame, null)).toEqual({ x: 0, y: 0, width: 500, height: 400 })
  })

  it('keeps the aspect ratio', () => {
    const result = dragCrop(start, 'se', 200, 0, frame, 1)
    expect(result).toEqual({ x: 100, y: 100, width: 600, height: 600 })
  })

  it('keeps the aspect ratio at the frame edge', () => {
    const result = dragCrop(start, 'se', 0, 5000, frame, 1)
    expect(result).toEqual({ x: 100, y: 100, width: 980, height: 980 })
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
