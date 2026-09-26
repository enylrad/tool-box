import { describe, expect, it } from 'vitest'
import { IDENTITY_TRANSFORM } from './cropGeometry'
import { computePreviewLayout } from './previewLayout'

const source = { width: 1600, height: 900 }

describe('computePreviewLayout', () => {
  it('fills the box when nothing changes', () => {
    const layout = computePreviewLayout(source, IDENTITY_TRANSFORM)
    expect(layout.aspectRatio).toBeCloseTo(16 / 9)
    expect(layout.stage).toMatchObject({ width: '100%', height: '100%' })
    expect(layout.video).toEqual({ width: '100%', height: '100%', left: '0%', top: '0%' })
  })

  it('swaps the stage for a quarter turn', () => {
    const layout = computePreviewLayout(source, { ...IDENTITY_TRANSFORM, rotation: 90, flipHorizontal: true })
    expect(layout.aspectRatio).toBeCloseTo(9 / 16)
    expect(parseFloat(layout.stage.width)).toBeCloseTo((1600 / 900) * 100)
    expect(parseFloat(layout.stage.height)).toBeCloseTo((900 / 1600) * 100)
    expect(layout.stage.transform).toBe('translate(-50%, -50%) rotate(90deg) scale(-1, 1)')
  })

  it('offsets the video so only the crop shows', () => {
    const layout = computePreviewLayout(source, { ...IDENTITY_TRANSFORM, crop: { x: 400, y: 0, width: 800, height: 900 } })
    expect(layout.aspectRatio).toBeCloseTo(800 / 900)
    expect(layout.video).toEqual({ width: '200%', height: '100%', left: '-50%', top: '0%' })
  })
})
