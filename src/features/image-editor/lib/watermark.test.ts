import { describe, expect, it } from 'vitest'
import { GRID_POSITIONS, relativeToImage, tilePositions, watermarkAnchor, watermarkFontSize } from './watermark'

const canvas = { width: 1000, height: 600 }

describe('watermark sizes', () => {
  it('scales with the shorter side', () => {
    expect(watermarkFontSize(canvas, 5)).toBe(30)
    expect(watermarkFontSize({ width: 600, height: 1000 }, 5)).toBe(30)
    expect(relativeToImage(canvas, 3)).toBe(18)
  })

  it('keeps a minimum readable font size', () => {
    expect(watermarkFontSize({ width: 50, height: 50 }, 1)).toBe(6)
  })
})

describe('watermarkAnchor', () => {
  it('places each grid position against the right edges', () => {
    const anchors = Object.fromEntries(GRID_POSITIONS.map((position) => [position, watermarkAnchor(canvas, position, 20)]))
    expect(anchors['top-left']).toEqual({ x: 20, y: 20, align: 'left', baseline: 'top' })
    expect(anchors.top).toEqual({ x: 500, y: 20, align: 'center', baseline: 'top' })
    expect(anchors['top-right']).toEqual({ x: 980, y: 20, align: 'right', baseline: 'top' })
    expect(anchors.left).toEqual({ x: 20, y: 300, align: 'left', baseline: 'middle' })
    expect(anchors.center).toEqual({ x: 500, y: 300, align: 'center', baseline: 'middle' })
    expect(anchors.right).toEqual({ x: 980, y: 300, align: 'right', baseline: 'middle' })
    expect(anchors['bottom-left']).toEqual({ x: 20, y: 580, align: 'left', baseline: 'bottom' })
    expect(anchors.bottom).toEqual({ x: 500, y: 580, align: 'center', baseline: 'bottom' })
    expect(anchors['bottom-right']).toEqual({ x: 980, y: 580, align: 'right', baseline: 'bottom' })
  })
})

describe('tilePositions', () => {
  const text = { width: 200, height: 30 }
  const gap = 40

  // Rotate a tile centre back into image coordinates (origin at the top-left corner).
  const toImage = ({ x, y }: { x: number; y: number }, angle: number) => ({
    x: canvas.width / 2 + x * Math.cos(angle) - y * Math.sin(angle),
    y: canvas.height / 2 + x * Math.sin(angle) + y * Math.cos(angle),
  })

  it('includes the centre of the image', () => {
    expect(tilePositions(canvas, text, gap)).toContainEqual({ x: 0, y: 0 })
  })

  it('reaches every corner of the image at any angle', () => {
    const positions = tilePositions(canvas, text, gap)
    const reach = text.width + gap
    for (const degrees of [-90, -30, 0, 45]) {
      const inImage = positions.map((position) => toImage(position, (degrees * Math.PI) / 180))
      for (const corner of [
        { x: 0, y: 0 },
        { x: canvas.width, y: 0 },
        { x: 0, y: canvas.height },
        { x: canvas.width, y: canvas.height },
      ]) {
        const nearest = Math.min(...inImage.map((point) => Math.hypot(point.x - corner.x, point.y - corner.y)))
        expect(nearest).toBeLessThan(reach)
      }
    }
  })

  it('spaces texts by the gap and offsets every other row like bricks', () => {
    const positions = tilePositions(canvas, text, gap)
    const firstRow = positions.filter((position) => position.y === 0).map((position) => position.x)
    const secondRow = positions.filter((position) => position.y === text.height + gap).map((position) => position.x)
    expect(firstRow).toContain(0)
    expect(firstRow).toContain(text.width + gap)
    expect(secondRow).toContain((text.width + gap) / 2)
  })

  it('repeats more with a smaller gap', () => {
    expect(tilePositions(canvas, text, 0).length).toBeGreaterThan(tilePositions(canvas, text, 100).length)
  })
})
