import type { CropRect, Size } from '../../../lib/cropGeometry'
import { outputSize, type Transform } from './cropGeometry'

export type ImageFormatId = 'jpeg' | 'png' | 'webp'

interface ImageFormat {
  label: string
  mimeType: string
  extension: string
  /** Quality for lossy formats; ignored by PNG. */
  quality?: number
}

export const IMAGE_FORMATS: Record<ImageFormatId, ImageFormat> = {
  jpeg: { label: 'JPG', mimeType: 'image/jpeg', extension: 'jpg', quality: 0.92 },
  png: { label: 'PNG', mimeType: 'image/png', extension: 'png' },
  webp: { label: 'WebP', mimeType: 'image/webp', extension: 'webp', quality: 0.92 },
}

export const IMAGE_FORMAT_IDS = Object.keys(IMAGE_FORMATS) as ImageFormatId[]

/** File extension for an encoded blob's MIME type. */
export function extensionForMime(mimeType: string): string {
  return Object.values(IMAGE_FORMATS).find((format) => format.mimeType === mimeType)?.extension ?? 'png'
}

export interface FrameDrawPlan {
  /** Size of the image. */
  size: Size
  /** Area of the source frame to draw, in source pixels. */
  source: CropRect
  /** Clockwise rotation in radians. */
  rotation: number
  scaleX: 1 | -1
  scaleY: 1 | -1
}

/** How to draw one frame so it matches the exported video: crop → flip → rotate. */
export function frameDrawPlan(frame: Size, transform: Transform): FrameDrawPlan {
  return {
    size: outputSize(frame, transform),
    source: transform.crop ?? { x: 0, y: 0, width: frame.width, height: frame.height },
    rotation: (transform.rotation * Math.PI) / 180,
    scaleX: transform.flipHorizontal ? -1 : 1,
    scaleY: transform.flipVertical ? -1 : 1,
  }
}

/**
 * Draws the frame the video is showing, cropped, flipped and rotated, and
 * encodes it. The blob's `type` is the format the browser actually produced:
 * browsers that cannot encode a format silently fall back to PNG.
 */
export function captureFrame(video: HTMLVideoElement, transform: Transform, formatId: ImageFormatId): Promise<Blob> {
  const format = IMAGE_FORMATS[formatId]
  const { size, source, rotation, scaleX, scaleY } = frameDrawPlan({ width: video.videoWidth, height: video.videoHeight }, transform)

  const canvas = document.createElement('canvas')
  canvas.width = size.width
  canvas.height = size.height
  const context = canvas.getContext('2d')
  if (!context) return Promise.reject(new Error('Canvas 2D is not available'))

  if (formatId === 'jpeg') {
    // JPEG has no transparency; without a fill transparent pixels turn black.
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, size.width, size.height)
  }
  context.translate(size.width / 2, size.height / 2)
  context.rotate(rotation)
  context.scale(scaleX, scaleY)
  context.drawImage(video, source.x, source.y, source.width, source.height, -source.width / 2, -source.height / 2, source.width, source.height)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('The image could not be encoded'))), format.mimeType, format.quality)
  })
}
