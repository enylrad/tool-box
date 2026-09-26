import jsQR from 'jsqr'
import type { QrLayout } from './layout'
import { FINDER_SIZE } from './qrMatrix'

function isFinderDark(layout: QrLayout, row: number, col: number): boolean {
  return layout.finders.some(([finderRow, finderCol]) => {
    const r = row - finderRow
    const c = col - finderCol
    if (r < 0 || c < 0 || r >= FINDER_SIZE || c >= FINDER_SIZE) return false
    const isRing = r === 0 || c === 0 || r === FINDER_SIZE - 1 || c === FINDER_SIZE - 1
    const isCenter = r >= 2 && r <= 4 && c >= 2 && c <= 4
    return isRing || isCenter
  })
}

/** Rasterizes a layout (square modules) and decodes it with jsQR, like a phone camera would. */
export function decodeLayout(layout: QrLayout, pixelsPerModule = 4, paddingModules = 4): string | null {
  const modulesPerSide = layout.gridSize + 2 * paddingModules
  const width = modulesPerSide * pixelsPerModule
  const pixels = new Uint8ClampedArray(width * width * 4).fill(255)
  for (let row = 0; row < layout.gridSize; row++) {
    for (let col = 0; col < layout.gridSize; col++) {
      if (!layout.modules[row * layout.gridSize + col] && !isFinderDark(layout, row, col)) continue
      for (let y = 0; y < pixelsPerModule; y++) {
        for (let x = 0; x < pixelsPerModule; x++) {
          const pixelRow = (row + paddingModules) * pixelsPerModule + y
          const pixelCol = (col + paddingModules) * pixelsPerModule + x
          const offset = (pixelRow * width + pixelCol) * 4
          pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 0
        }
      }
    }
  }
  return jsQR(pixels, width, width)?.data ?? null
}

/** Builds RGBA pixels for a shape: `isOn(x, y)` (0..1 coordinates) → opaque black, else transparent. */
export function rgbaFromShape(resolution: number, isOn: (x: number, y: number) => boolean): Uint8ClampedArray {
  const rgba = new Uint8ClampedArray(resolution * resolution * 4)
  for (let y = 0; y < resolution; y++) {
    for (let x = 0; x < resolution; x++) {
      if (isOn((x + 0.5) / resolution, (y + 0.5) / resolution)) rgba[(y * resolution + x) * 4 + 3] = 255
    }
  }
  return rgba
}
