/**
 * A square on/off grid describing a silhouette. The source image is fitted
 * ("contain") into a `resolution × resolution` canvas before sampling.
 */
export interface ShapeMask {
  resolution: number
  cells: Uint8Array
}

export type ShapeMaskMode = 'alpha' | 'luminance'

interface ShapeMaskOptions {
  /** `alpha`: opaque pixels form the shape (transparent PNG/SVG). `luminance`: dark pixels do. */
  mode: ShapeMaskMode
  invert: boolean
}

const ALPHA_THRESHOLD = 128
const LUMINANCE_THRESHOLD = 128

/** True when a meaningful part of the image is transparent. */
export function hasTransparency(rgba: Uint8ClampedArray): boolean {
  let transparentPixels = 0
  const pixelCount = rgba.length / 4
  for (let index = 3; index < rgba.length; index += 4) {
    if (rgba[index] < 250) transparentPixels++
  }
  return transparentPixels / pixelCount > 0.01
}

/** Converts RGBA pixels (row-major, `resolution²` pixels) into a shape mask. */
export function buildShapeMask(rgba: Uint8ClampedArray, resolution: number, { mode, invert }: ShapeMaskOptions): ShapeMask {
  const cells = new Uint8Array(resolution * resolution)
  for (let pixel = 0; pixel < cells.length; pixel++) {
    const offset = pixel * 4
    const alpha = rgba[offset + 3]
    let isOn: boolean
    if (mode === 'alpha') {
      isOn = alpha >= ALPHA_THRESHOLD
      if (invert) isOn = !isOn
    } else {
      // Pixels outside the fitted image are transparent and never part of the shape.
      if (alpha < ALPHA_THRESHOLD) {
        isOn = false
      } else {
        const luminance = 0.299 * rgba[offset] + 0.587 * rgba[offset + 1] + 0.114 * rgba[offset + 2]
        isOn = invert ? luminance >= LUMINANCE_THRESHOLD : luminance < LUMINANCE_THRESHOLD
      }
    }
    cells[pixel] = isOn ? 1 : 0
  }
  return { resolution, cells }
}

/** Samples the mask at the center of cell (row, col) of a `gridSize × gridSize` grid. */
export function sampleShapeMask(mask: ShapeMask, gridSize: number, row: number, col: number): boolean {
  const maskRow = Math.min(mask.resolution - 1, Math.floor(((row + 0.5) / gridSize) * mask.resolution))
  const maskCol = Math.min(mask.resolution - 1, Math.floor(((col + 0.5) / gridSize) * mask.resolution))
  return mask.cells[maskRow * mask.resolution + maskCol] === 1
}
