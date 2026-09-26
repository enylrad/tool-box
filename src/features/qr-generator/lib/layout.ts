import { finderOrigins, isFinderModule, type QrMatrix } from './qrMatrix'
import { createRandom } from './random'
import { sampleShapeMask, type ShapeMask } from './shapeMask'

export const MAX_LOGO_SIZE_RATIO = 0.3
export const DATA_MODULE = 1
export const FUNCTION_MODULE = 2
const MIN_SHAPE_QUIET_ZONE = 2

export interface LogoBox {
  row: number
  col: number
  size: number
}

/** Everything the SVG renderer needs, in module units. */
export interface QrLayout {
  gridSize: number
  /**
   * 0 = light, 1 = dark data or decorative module, 2 = dark function-pattern module
   * (timing, alignment, format/version info). Finder patterns are excluded; they are drawn separately.
   */
  modules: Uint8Array
  /** Top-left corners (row, col) of the three 7×7 finder patterns, in grid coordinates. */
  finders: Array<[row: number, col: number]>
  qrOffset: number
  qrSize: number
  logoBox: LogoBox | null
  /** Share of the area around the code covered by the silhouette (null without a shape). */
  shapeCoverage: number | null
}

export interface ShapeOptions {
  mask: ShapeMask
  /** Silhouette width relative to the QR code width (e.g. 2 = twice as wide). */
  scale: number
  /** Probability that a module inside the silhouette is dark. */
  density: number
  seed: number
}

export interface LayoutOptions {
  /** Quiet zone around the whole image, in modules. */
  margin: number
  /** Logo width relative to the QR code width. */
  logoSizeRatio?: number
  shape?: ShapeOptions
}

/** Returns the smallest n ≥ value such that (n - reference) is even, so things stay centered. */
function matchParity(value: number, reference: number): number {
  return (value - reference) % 2 === 0 ? value : value + 1
}

function computeLogoBox(qrOffset: number, qrSize: number, sizeRatio: number): LogoBox {
  const ratio = Math.min(Math.max(sizeRatio, 0), MAX_LOGO_SIZE_RATIO)
  let size = Math.round(qrSize * ratio)
  if ((qrSize - size) % 2 !== 0) size -= 1
  const offset = qrOffset + (qrSize - size) / 2
  return { row: offset, col: offset, size }
}

/**
 * Places the QR matrix on a grid, optionally surrounded by decorative modules
 * that follow a silhouette, and clears the modules hidden behind a logo.
 */
export function composeLayout(matrix: QrMatrix, { margin, logoSizeRatio, shape }: LayoutOptions): QrLayout {
  const qrSize = matrix.size
  let gridSize: number
  let qrOffset: number
  let innerSize = qrSize
  let quietZone = 0

  if (shape) {
    quietZone = Math.max(margin, MIN_SHAPE_QUIET_ZONE)
    innerSize = matchParity(Math.max(qrSize + 2 * quietZone + 2, Math.round(qrSize * shape.scale)), qrSize)
    gridSize = innerSize + 2 * margin
    qrOffset = margin + (innerSize - qrSize) / 2
  } else {
    gridSize = qrSize + 2 * margin
    qrOffset = margin
  }

  const modules = new Uint8Array(gridSize * gridSize)
  for (let row = 0; row < qrSize; row++) {
    for (let col = 0; col < qrSize; col++) {
      if (matrix.isDark(row, col) && !isFinderModule(qrSize, row, col)) {
        modules[(row + qrOffset) * gridSize + col + qrOffset] = matrix.isFunctionModule(row, col) ? FUNCTION_MODULE : DATA_MODULE
      }
    }
  }

  let shapeCoverage: number | null = null
  if (shape) {
    const random = createRandom(shape.seed)
    const clearStart = qrOffset - quietZone
    const clearEnd = qrOffset + qrSize + quietZone
    let shapeCells = 0
    let outsideCells = 0
    for (let innerRow = 0; innerRow < innerSize; innerRow++) {
      for (let innerCol = 0; innerCol < innerSize; innerCol++) {
        const row = innerRow + margin
        const col = innerCol + margin
        const isInClearZone = row >= clearStart && row < clearEnd && col >= clearStart && col < clearEnd
        if (isInClearZone) continue
        outsideCells++
        if (!sampleShapeMask(shape.mask, innerSize, innerRow, innerCol)) continue
        shapeCells++
        if (random() < shape.density) modules[row * gridSize + col] = DATA_MODULE
      }
    }
    shapeCoverage = outsideCells === 0 ? 0 : shapeCells / outsideCells
  }

  let logoBox: LogoBox | null = null
  if (logoSizeRatio && logoSizeRatio > 0) {
    logoBox = computeLogoBox(qrOffset, qrSize, logoSizeRatio)
    for (let row = logoBox.row; row < logoBox.row + logoBox.size; row++) {
      modules.fill(0, row * gridSize + logoBox.col, row * gridSize + logoBox.col + logoBox.size)
    }
  }

  const finders = finderOrigins(qrSize).map(([row, col]): [number, number] => [row + qrOffset, col + qrOffset])

  return { gridSize, modules, finders, qrOffset, qrSize, logoBox, shapeCoverage }
}
