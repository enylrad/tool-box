import { describe, expect, it } from 'vitest'
import { buildShapeMask, hasTransparency, sampleShapeMask } from './shapeMask'

function rgba(pixels: Array<[number, number, number, number]>): Uint8ClampedArray {
  return new Uint8ClampedArray(pixels.flat())
}

describe('shape mask', () => {
  const pixels = rgba([
    [0, 0, 0, 255], // opaque black
    [255, 255, 255, 255], // opaque white
    [0, 0, 0, 0], // transparent
    [30, 30, 30, 255], // opaque dark
  ])

  it('uses opacity in alpha mode', () => {
    expect(Array.from(buildShapeMask(pixels, 2, { mode: 'alpha', invert: false }).cells)).toEqual([1, 1, 0, 1])
    expect(Array.from(buildShapeMask(pixels, 2, { mode: 'alpha', invert: true }).cells)).toEqual([0, 0, 1, 0])
  })

  it('uses darkness in luminance mode and never includes transparent pixels', () => {
    expect(Array.from(buildShapeMask(pixels, 2, { mode: 'luminance', invert: false }).cells)).toEqual([1, 0, 0, 1])
    expect(Array.from(buildShapeMask(pixels, 2, { mode: 'luminance', invert: true }).cells)).toEqual([0, 1, 0, 0])
  })

  it('detects transparency', () => {
    expect(hasTransparency(pixels)).toBe(true)
    expect(hasTransparency(rgba([[1, 2, 3, 255]]))).toBe(false)
  })

  it('samples cell centers at any grid size', () => {
    const mask = buildShapeMask(pixels, 2, { mode: 'alpha', invert: false })
    expect(sampleShapeMask(mask, 4, 0, 0)).toBe(true)
    expect(sampleShapeMask(mask, 4, 3, 0)).toBe(false)
    expect(sampleShapeMask(mask, 4, 3, 3)).toBe(true)
  })
})
