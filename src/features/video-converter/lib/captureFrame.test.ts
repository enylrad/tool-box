import { describe, expect, it } from 'vitest'
import { IDENTITY_TRANSFORM } from './cropGeometry'
import { extensionForMime, frameDrawPlan } from './captureFrame'

const frame = { width: 1920, height: 1080 }
const crop = { x: 100, y: 50, width: 640, height: 360 }

describe('frameDrawPlan', () => {
  it('draws the whole frame when there is no crop', () => {
    expect(frameDrawPlan(frame, IDENTITY_TRANSFORM)).toEqual({
      size: frame,
      source: { x: 0, y: 0, ...frame },
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
    })
  })

  it('draws only the cropped area at its own size', () => {
    const plan = frameDrawPlan(frame, { ...IDENTITY_TRANSFORM, crop })
    expect(plan.size).toEqual({ width: 640, height: 360 })
    expect(plan.source).toEqual(crop)
  })

  it('swaps the size when turned sideways', () => {
    expect(frameDrawPlan(frame, { ...IDENTITY_TRANSFORM, crop, rotation: 90 })).toMatchObject({
      size: { width: 360, height: 640 },
      rotation: Math.PI / 2,
    })
    expect(frameDrawPlan(frame, { ...IDENTITY_TRANSFORM, rotation: 270 }).size).toEqual({ width: 1080, height: 1920 })
  })

  it('mirrors on the flipped axes', () => {
    expect(frameDrawPlan(frame, { ...IDENTITY_TRANSFORM, flipHorizontal: true })).toMatchObject({ scaleX: -1, scaleY: 1 })
    expect(frameDrawPlan(frame, { ...IDENTITY_TRANSFORM, flipVertical: true })).toMatchObject({ scaleX: 1, scaleY: -1 })
  })
})

describe('extensionForMime', () => {
  it('maps encoded types to extensions and falls back to png', () => {
    expect(extensionForMime('image/jpeg')).toBe('jpg')
    expect(extensionForMime('image/webp')).toBe('webp')
    expect(extensionForMime('image/bmp')).toBe('png')
  })
})
