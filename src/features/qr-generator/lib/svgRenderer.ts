import { toSafeHexColor } from '../../../lib/color'
import { FINDER_SIZE } from './qrMatrix'
import { DATA_MODULE, type QrLayout } from './layout'

export type ModuleShape = 'square' | 'rounded' | 'dots'

export interface SvgStyle {
  foreground: string
  background: string
  transparentBackground: boolean
  moduleShape: ModuleShape
}

/** Default width/height of the SVG; it is a vector, so this only affects the initial display size. */
const DEFAULT_SIZE_PX = 512
const ROUNDED_MODULE_RADIUS = 0.3
const DOT_RADIUS = 0.45

/** Rounds coordinates to keep the markup small and free of float noise. */
function n(value: number): string {
  return String(Math.round(value * 1000) / 1000)
}

function escapeAttribute(value: string): string {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function roundedRectPath(x: number, y: number, size: number, radius: number): string {
  const side = size - 2 * radius
  const r = n(radius)
  return (
    `M${n(x + radius)} ${n(y)}h${n(side)}a${r} ${r} 0 0 1 ${r} ${r}v${n(side)}` +
    `a${r} ${r} 0 0 1 -${r} ${r}h-${n(side)}a${r} ${r} 0 0 1 -${r} -${r}v-${n(side)}a${r} ${r} 0 0 1 ${r} -${r}z`
  )
}

function circlePath(centerX: number, centerY: number, radius: number): string {
  const r = n(radius)
  return `M${n(centerX - radius)} ${n(centerY)}a${r} ${r} 0 1 0 ${n(2 * radius)} 0a${r} ${r} 0 1 0 -${n(2 * radius)} 0z`
}

/** Horizontal runs of matching modules merged into rectangles. */
function squareModulesPath({ gridSize, modules }: QrLayout, include: (value: number) => boolean): string {
  let path = ''
  for (let row = 0; row < gridSize; row++) {
    let col = 0
    while (col < gridSize) {
      if (!include(modules[row * gridSize + col])) {
        col++
        continue
      }
      const start = col
      while (col < gridSize && include(modules[row * gridSize + col])) col++
      path += `M${start} ${row}h${col - start}v1h-${col - start}z`
    }
  }
  return path
}

function individualModulesPath({ gridSize, modules }: QrLayout, shape: 'rounded' | 'dots'): string {
  let path = ''
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      if (modules[row * gridSize + col] !== DATA_MODULE) continue
      path +=
        shape === 'dots'
          ? circlePath(col + 0.5, row + 0.5, DOT_RADIUS)
          : roundedRectPath(col, row, 1, ROUNDED_MODULE_RADIUS)
    }
  }
  return path
}

/** Outer ring + inner block of each finder pattern, drawn with the even-odd fill rule. */
function findersPath({ finders }: QrLayout, shape: ModuleShape): string {
  return finders
    .map(([row, col]) => {
      if (shape === 'dots') {
        const center = FINDER_SIZE / 2
        return [3.5, 2.5, 1.5].map((radius) => circlePath(col + center, row + center, radius)).join('')
      }
      if (shape === 'rounded') {
        return (
          roundedRectPath(col, row, 7, 2) + roundedRectPath(col + 1, row + 1, 5, 1.3) + roundedRectPath(col + 2, row + 2, 3, 0.8)
        )
      }
      return `M${col} ${row}h7v7h-7zM${col + 1} ${row + 1}h5v5h-5zM${col + 2} ${row + 2}h3v3h-3z`
    })
    .join('')
}

/** Renders a layout as a standalone SVG document (no external references). */
export function renderQrSvg(layout: QrLayout, style: SvgStyle, logoDataUrl?: string | null): string {
  const foreground = toSafeHexColor(style.foreground, '#000000')
  const background = toSafeHexColor(style.background, '#ffffff')
  const size = layout.gridSize

  // With rounded or dot modules, function patterns (timing, alignment…) stay solid:
  // scanners rely on them to locate the grid, and broken-up versions often fail to decode.
  const modulesPath =
    style.moduleShape === 'square'
      ? squareModulesPath(layout, (value) => value !== 0)
      : squareModulesPath(layout, (value) => value !== 0 && value !== DATA_MODULE) +
        individualModulesPath(layout, style.moduleShape)

  const parts = [
    `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" viewBox="0 0 ${size} ${size}" width="${DEFAULT_SIZE_PX}" height="${DEFAULT_SIZE_PX}">`,
  ]
  if (!style.transparentBackground) {
    parts.push(`<rect width="${size}" height="${size}" fill="${background}"/>`)
  }
  if (modulesPath) {
    const crispEdges = style.moduleShape === 'square' ? ' shape-rendering="crispEdges"' : ''
    parts.push(`<path d="${modulesPath}" fill="${foreground}"${crispEdges}/>`)
  }
  parts.push(`<path d="${findersPath(layout, style.moduleShape)}" fill="${foreground}" fill-rule="evenodd"/>`)

  if (logoDataUrl && layout.logoBox) {
    const { row, col, size: boxSize } = layout.logoBox
    const padding = Math.max(0.5, boxSize * 0.08)
    const href = escapeAttribute(logoDataUrl)
    parts.push(
      `<image x="${n(col + padding)}" y="${n(row + padding)}" width="${n(boxSize - 2 * padding)}" height="${n(boxSize - 2 * padding)}" preserveAspectRatio="xMidYMid meet" href="${href}" xlink:href="${href}"/>`,
    )
  }

  parts.push('</svg>')
  return parts.join('\n')
}
