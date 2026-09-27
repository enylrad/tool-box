import type { Size } from '../../../lib/cropGeometry'

export type WatermarkPosition =
  | 'top-left'
  | 'top'
  | 'top-right'
  | 'left'
  | 'center'
  | 'right'
  | 'bottom-left'
  | 'bottom'
  | 'bottom-right'
  | 'tiled'

export interface WatermarkSettings {
  enabled: boolean
  text: string
  color: string
  /** From 0 (invisible) to 1 (opaque). */
  opacity: number
  /** Font size as a percentage of the image's shorter side, so it scales with the resize. */
  sizePercent: number
  position: WatermarkPosition
  /** Distance from the edges as a percentage of the image's shorter side. */
  marginPercent: number
  /** Tiled only: gap between repeated texts, as a percentage of the image's shorter side. */
  tileSpacingPercent: number
  /** Tiled only: rotation in degrees, negative is counter-clockwise. */
  tileAngle: number
}

export const DEFAULT_WATERMARK: WatermarkSettings = {
  enabled: false,
  text: '© Your name',
  color: '#ffffff',
  opacity: 0.6,
  sizePercent: 5,
  position: 'bottom-right',
  marginPercent: 3,
  tileSpacingPercent: 10,
  tileAngle: -30,
}

/** The 3×3 grid of positions, in reading order. */
export const GRID_POSITIONS: Exclude<WatermarkPosition, 'tiled'>[] = [
  'top-left',
  'top',
  'top-right',
  'left',
  'center',
  'right',
  'bottom-left',
  'bottom',
  'bottom-right',
]

export const WATERMARK_POSITIONS: readonly WatermarkPosition[] = [...GRID_POSITIONS, 'tiled']

export function watermarkFont(fontSize: number) {
  return `600 ${fontSize}px system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`
}

const shorterSide = ({ width, height }: Size) => Math.min(width, height)

export function watermarkFontSize(canvas: Size, sizePercent: number): number {
  return Math.max(6, Math.round((shorterSide(canvas) * sizePercent) / 100))
}

/** Converts a percentage of the image's shorter side (margin, tile spacing) to pixels. */
export function relativeToImage(canvas: Size, percent: number): number {
  return Math.round((shorterSide(canvas) * percent) / 100)
}

export interface TextAnchor {
  x: number
  y: number
  align: 'left' | 'center' | 'right'
  baseline: 'top' | 'middle' | 'bottom'
}

/** Where to draw the text, and how to align it, for one of the 9 grid positions. */
export function watermarkAnchor(canvas: Size, position: Exclude<WatermarkPosition, 'tiled'>, margin: number): TextAnchor {
  const vertical = position.startsWith('top') ? 'top' : position.startsWith('bottom') ? 'bottom' : 'middle'
  const horizontal = position.endsWith('left') ? 'left' : position.endsWith('right') ? 'right' : 'center'
  return {
    x: horizontal === 'left' ? margin : horizontal === 'right' ? canvas.width - margin : canvas.width / 2,
    y: vertical === 'top' ? margin : vertical === 'bottom' ? canvas.height - margin : canvas.height / 2,
    align: horizontal,
    baseline: vertical,
  }
}

/**
 * Centres of a brick pattern of text boxes separated by `gap` pixels, relative
 * to the image centre and in the rotated coordinate system. It covers a circle
 * through the image corners, so no corner is left empty at any angle.
 */
export function tilePositions(canvas: Size, text: Size, gap: number): { x: number; y: number }[] {
  const radius = Math.hypot(canvas.width, canvas.height) / 2
  const stepX = Math.max(1, text.width + gap)
  const stepY = Math.max(1, text.height + gap)
  const rows = Math.ceil(radius / stepY)
  const columns = Math.ceil(radius / stepX) + 1
  const positions: { x: number; y: number }[] = []
  for (let row = -rows; row <= rows; row++) {
    const offset = row % 2 === 0 ? 0 : stepX / 2
    for (let column = -columns; column <= columns; column++) {
      positions.push({ x: column * stepX + offset, y: row * stepY })
    }
  }
  return positions
}
