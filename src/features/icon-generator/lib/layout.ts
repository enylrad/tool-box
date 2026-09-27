import type { IconVariant } from './platforms'

export type IconShape = 'square' | 'rounded' | 'circle'

/** Corner radius of the "rounded" shape, relative to the icon size. */
export const ROUNDED_CORNER_RATIO = 0.2

/** Android adaptive icons are 108 dp, of which the inner 66 dp are never masked. */
export const ADAPTIVE_SAFE_ZONE = 66 / 108
/** PWA maskable icons keep their content inside a circle of 80 % of the icon. */
export const MASKABLE_SAFE_ZONE = 0.8

export const MAX_PADDING = 0.25

interface VariantLayout {
  /** Share of the icon the artwork may use before padding. */
  zone: number
  /** `optional` follows the user's "transparent background" setting. */
  background: 'never' | 'optional' | 'always'
  /** `setting` follows the user's shape setting. */
  shape: IconShape | 'setting'
}

const VARIANT_LAYOUT: Record<IconVariant, VariantLayout> = {
  standard: { zone: 1, background: 'optional', shape: 'setting' },
  round: { zone: 1, background: 'optional', shape: 'circle' },
  opaque: { zone: 1, background: 'always', shape: 'square' },
  'adaptive-foreground': { zone: ADAPTIVE_SAFE_ZONE, background: 'never', shape: 'square' },
  monochrome: { zone: ADAPTIVE_SAFE_ZONE, background: 'never', shape: 'square' },
  maskable: { zone: MASKABLE_SAFE_ZONE, background: 'always', shape: 'square' },
}

export interface Rect {
  x: number
  y: number
  width: number
  height: number
}

export function clampPadding(padding: number): number {
  return Math.min(MAX_PADDING, Math.max(0, Number.isFinite(padding) ? padding : 0))
}

/** Where the source image is drawn: centered and scaled to fit ("contain") inside the usable area. */
export function artworkRect(size: number, variant: IconVariant, padding: number, sourceWidth: number, sourceHeight: number): Rect {
  const box = size * VARIANT_LAYOUT[variant].zone * (1 - 2 * clampPadding(padding))
  const scale = box / Math.max(sourceWidth, sourceHeight, 1)
  const width = sourceWidth * scale
  const height = sourceHeight * scale
  return { x: (size - width) / 2, y: (size - height) / 2, width, height }
}

export function hasBackground(variant: IconVariant, transparentBackground: boolean): boolean {
  const { background } = VARIANT_LAYOUT[variant]
  return background === 'always' || (background === 'optional' && !transparentBackground)
}

export function iconShape(variant: IconVariant, shapeSetting: IconShape): IconShape {
  const { shape } = VARIANT_LAYOUT[variant]
  return shape === 'setting' ? shapeSetting : shape
}
