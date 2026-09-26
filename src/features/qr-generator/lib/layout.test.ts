import { describe, expect, it } from 'vitest'
import { composeLayout, DATA_MODULE, FUNCTION_MODULE, type QrLayout } from './layout'
import { createQrMatrix } from './qrMatrix'
import { buildShapeMask } from './shapeMask'
import { decodeLayout, rgbaFromShape } from './testUtils'

const PAYLOAD = 'https://enylrad.github.io/tool-box/ — ñandú 🚀'

function darkCount(layout: QrLayout, predicate: (row: number, col: number) => boolean): number {
  let count = 0
  for (let row = 0; row < layout.gridSize; row++) {
    for (let col = 0; col < layout.gridSize; col++) {
      if (layout.modules[row * layout.gridSize + col] && predicate(row, col)) count++
    }
  }
  return count
}

const heartMask = buildShapeMask(
  rgbaFromShape(256, (x, y) => {
    const u = (x - 0.5) * 2.6
    const v = (0.45 - y) * 2.6
    return (u * u + v * v - 1) ** 3 - u * u * v ** 3 <= 0
  }),
  256,
  { mode: 'alpha', invert: false },
)

describe('composeLayout', () => {
  it('adds the margin around a plain code and decodes (UTF-8 included)', () => {
    const matrix = createQrMatrix(PAYLOAD, 'M')
    const layout = composeLayout(matrix, { margin: 4 })
    expect(layout.gridSize).toBe(matrix.size + 8)
    expect(layout.qrOffset).toBe(4)
    expect(darkCount(layout, (row, col) => row < 4 || col < 4)).toBe(0)
    expect(decodeLayout(layout, 4, 0)).toBe(PAYLOAD)
  })

  it('clears the logo area and still decodes with high error correction', () => {
    const matrix = createQrMatrix(PAYLOAD, 'H')
    const layout = composeLayout(matrix, { margin: 2, logoSizeRatio: 0.3 })
    const box = layout.logoBox!
    expect(box.size).toBeGreaterThan(0)
    expect((matrix.size - box.size) % 2).toBe(0)
    const inBox = (row: number, col: number) =>
      row >= box.row && row < box.row + box.size && col >= box.col && col < box.col + box.size
    expect(darkCount(layout, inBox)).toBe(0)
    expect(decodeLayout(layout)).toBe(PAYLOAD)
  })

  it('fills a silhouette around the code, keeps the quiet zone clear, and still decodes', () => {
    const matrix = createQrMatrix(PAYLOAD, 'M')
    const margin = 2
    const layout = composeLayout(matrix, {
      margin,
      shape: { mask: heartMask, scale: 2.2, density: 0.5, seed: 42 },
    })
    const { qrOffset, qrSize, gridSize } = layout
    expect(gridSize).toBeGreaterThan(qrSize * 2)
    expect((gridSize - qrSize) % 2).toBe(0)

    const quiet = 2
    const inQuietRing = (row: number, col: number) => {
      const inOuter = row >= qrOffset - quiet && row < qrOffset + qrSize + quiet && col >= qrOffset - quiet && col < qrOffset + qrSize + quiet
      const inCode = row >= qrOffset && row < qrOffset + qrSize && col >= qrOffset && col < qrOffset + qrSize
      return inOuter && !inCode
    }
    expect(darkCount(layout, inQuietRing)).toBe(0)
    expect(darkCount(layout, (row, col) => row < margin || col < margin)).toBe(0)
    expect(darkCount(layout, (row, col) => !inQuietRing(row, col) && (row < qrOffset - quiet || row >= qrOffset + qrSize + quiet))).toBeGreaterThan(0)
    expect(layout.shapeCoverage).toBeGreaterThan(0.3)
    expect(decodeLayout(layout)).toBe(PAYLOAD)
  })

  it('distinguishes function-pattern modules from data modules', () => {
    const matrix = createQrMatrix(PAYLOAD, 'M')
    const layout = composeLayout(matrix, { margin: 0 })
    // Row 6 between the finders is the horizontal timing pattern: dark on even columns.
    expect(layout.modules[6 * layout.gridSize + 8]).toBe(FUNCTION_MODULE)
    expect(layout.modules.includes(DATA_MODULE)).toBe(true)
  })

  it('is deterministic for the same seed', () => {
    const matrix = createQrMatrix(PAYLOAD, 'M')
    const options = { margin: 2, shape: { mask: heartMask, scale: 2, density: 0.5, seed: 7 } }
    expect(composeLayout(matrix, options).modules).toEqual(composeLayout(matrix, options).modules)
  })
})
