import type { CropRect, Size } from '../../../lib/cropGeometry'
import { OUTPUT_FORMATS, type OutputSettings } from './output'
import {
  relativeToImage,
  tilePositions,
  watermarkAnchor,
  watermarkFont,
  watermarkFontSize,
  type WatermarkSettings,
} from './watermark'

export interface RenderOptions {
  /** Area of the source image to keep, in source pixels. */
  crop: CropRect
  /** Size of the exported image. */
  size: Size
  watermark: WatermarkSettings
  output: OutputSettings
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
 * Halves the cropped area until it is less than twice the target size. A single
 * large downscale skips most source pixels and looks aliased; halving one step
 * at a time averages them.
 */
function stepDown(image: CanvasImageSource, crop: CropRect, target: Size): { source: CanvasImageSource; rect: CropRect } {
  let source = image
  let rect = crop
  while (rect.width / 2 >= target.width && rect.height / 2 >= target.height) {
    const width = Math.round(rect.width / 2)
    const height = Math.round(rect.height / 2)
    const { canvas, context } = createCanvas(width, height)
    context.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, width, height)
    source = canvas
    rect = { x: 0, y: 0, width, height }
  }
  return { source, rect }
}

/** Draws the text watermark over the whole output canvas. */
export function drawWatermark(context: CanvasRenderingContext2D, canvas: Size, watermark: WatermarkSettings) {
  const text = watermark.text.trim()
  if (!watermark.enabled || !text) return

  const fontSize = watermarkFontSize(canvas, watermark.sizePercent)
  context.save()
  context.globalAlpha = watermark.opacity
  context.fillStyle = watermark.color
  context.font = watermarkFont(fontSize)
  // A soft shadow keeps light text readable on light areas and vice versa.
  context.shadowColor = 'rgba(0, 0, 0, 0.35)'
  context.shadowBlur = Math.max(1, fontSize / 8)

  if (watermark.position === 'tiled') {
    const textSize = { width: context.measureText(text).width, height: fontSize }
    context.textAlign = 'center'
    context.textBaseline = 'middle'
    context.translate(canvas.width / 2, canvas.height / 2)
    context.rotate((watermark.tileAngle * Math.PI) / 180)
    const gap = relativeToImage(canvas, watermark.tileSpacingPercent)
    for (const { x, y } of tilePositions(canvas, textSize, gap)) context.fillText(text, x, y)
  } else {
    const anchor = watermarkAnchor(canvas, watermark.position, relativeToImage(canvas, watermark.marginPercent))
    context.textAlign = anchor.align
    context.textBaseline = anchor.baseline
    context.fillText(text, anchor.x, anchor.y)
  }
  context.restore()
}

function toBlob(canvas: HTMLCanvasElement, mimeType: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The image could not be encoded'))), mimeType, quality)
  })
}

/**
 * Crops, resizes and watermarks the image with the canvas API and encodes it.
 * The blob's `type` is the format the browser actually produced: browsers that
 * cannot encode a format silently fall back to PNG.
 */
export async function renderImage(image: CanvasImageSource, { crop, size, watermark, output }: RenderOptions): Promise<Blob> {
  const format = OUTPUT_FORMATS[output.format]
  const { source, rect } = stepDown(image, crop, size)
  const { canvas, context } = createCanvas(size.width, size.height)
  if (output.format === 'jpeg') {
    // JPEG has no transparency; without a fill transparent pixels turn black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size.width, size.height)
  }
  context.drawImage(source, rect.x, rect.y, rect.width, rect.height, 0, 0, size.width, size.height)
  drawWatermark(context, size, watermark)
  return toBlob(canvas, format.mimeType, output.quality)
}

const encoderSupport = new Map<string, boolean>()

/** Whether this browser's canvas can encode `mimeType` (Safari before 17 cannot write WebP). */
export function canEncode(mimeType: string): boolean {
  let supported = encoderSupport.get(mimeType)
  if (supported === undefined) {
    try {
      supported = createCanvas(1, 1).canvas.toDataURL(mimeType).startsWith(`data:${mimeType}`)
    } catch {
      supported = false
    }
    encoderSupport.set(mimeType, supported)
  }
  return supported
}
