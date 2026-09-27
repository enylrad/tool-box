import type { Rasterize } from './bundle'
import { ROUNDED_CORNER_RATIO, artworkRect, hasBackground, iconShape, type IconShape } from './layout'
import type { IconVariant } from './platforms'
import { encodeRgbPng } from './png'

export interface IconSource {
  image: HTMLImageElement
  width: number
  height: number
  /** Vector images are drawn directly at every target size, so they stay sharp. */
  isVector: boolean
}

export interface IconAppearance {
  transparentBackground: boolean
  backgroundColor: string
  shape: IconShape
  padding: number
}

type Drawable = HTMLImageElement | HTMLCanvasElement

interface PyramidLevel {
  image: Drawable
  width: number
  height: number
}

function createCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')
  context.imageSmoothingEnabled = true
  context.imageSmoothingQuality = 'high'
  return { canvas, context }
}

/**
 * Halves a raster image repeatedly. Downscaling one step at a time from the
 * nearest larger level keeps small icons sharp instead of aliased.
 */
function buildPyramid(source: IconSource): PyramidLevel[] {
  const levels: PyramidLevel[] = [{ image: source.image, width: source.width, height: source.height }]
  if (source.isVector) return levels
  let last = levels[0]
  while (Math.min(last.width, last.height) >= 32) {
    const width = Math.round(last.width / 2)
    const height = Math.round(last.height / 2)
    const { canvas, context } = createCanvas(width, height)
    context.drawImage(last.image, 0, 0, width, height)
    last = { image: canvas, width, height }
    levels.push(last)
  }
  return levels
}

function pickLevel(levels: PyramidLevel[], targetWidth: number): PyramidLevel {
  let best = levels[0]
  for (const level of levels) {
    if (level.width >= targetWidth) best = level
  }
  return best
}

function clipToShape(context: CanvasRenderingContext2D, size: number, shape: IconShape) {
  if (shape === 'square') return
  context.beginPath()
  if (shape === 'circle') context.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  else context.roundRect(0, 0, size, size, size * ROUNDED_CORNER_RATIO)
  context.clip()
}

function toPngBytes(canvas: HTMLCanvasElement): Promise<Uint8Array<ArrayBuffer>> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) reject(new Error('PNG encoding failed'))
      else blob.arrayBuffer().then((buffer) => resolve(new Uint8Array(buffer)), reject)
    }, 'image/png')
  })
}

/** Returns a canvas-based rasterizer for one source image and appearance. */
export function createRasterizer(source: IconSource, appearance: IconAppearance): Rasterize {
  let pyramid: PyramidLevel[] | null = null

  return async (size: number, variant: IconVariant, noAlpha: boolean) => {
    pyramid ??= buildPyramid(source)
    const { canvas, context } = createCanvas(size, size)

    clipToShape(context, size, iconShape(variant, appearance.shape))
    if (hasBackground(variant, appearance.transparentBackground)) {
      context.fillStyle = appearance.backgroundColor
      context.fillRect(0, 0, size, size)
    }

    const rect = artworkRect(size, variant, appearance.padding, source.width, source.height)
    const level = pickLevel(pyramid, rect.width)
    context.drawImage(level.image, rect.x, rect.y, rect.width, rect.height)

    if (variant === 'monochrome') {
      // Keep only the alpha channel: Android tints the silhouette with the wallpaper colors.
      context.globalCompositeOperation = 'source-in'
      context.fillStyle = '#ffffff'
      context.fillRect(0, 0, size, size)
    }

    if (noAlpha) return encodeRgbPng(size, size, context.getImageData(0, 0, size, size).data)
    return toPngBytes(canvas)
  }
}
