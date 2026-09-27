import type { CropRect, Size } from '../../../lib/cropGeometry'

/** Clockwise rotation in degrees. */
export type Rotation = 0 | 90 | 180 | 270

export interface Transform {
  rotation: Rotation
  flipHorizontal: boolean
  flipVertical: boolean
  /** Area to keep, in source pixels. `null` keeps the whole frame. */
  crop: CropRect | null
}

export const IDENTITY_TRANSFORM: Transform = { rotation: 0, flipHorizontal: false, flipVertical: false, crop: null }

export function rotate(rotation: Rotation, degrees: 90 | -90 | 180): Rotation {
  return ((((rotation + degrees) % 360) + 360) % 360) as Rotation
}

/** Rounds width and height down to even numbers, as H.264 requires. */
export function toEvenCrop(rect: CropRect): CropRect {
  return { ...rect, width: Math.max(2, rect.width - (rect.width % 2)), height: Math.max(2, rect.height - (rect.height % 2)) }
}

/** Size of the picture after cropping and rotating. */
export function outputSize(source: Size, transform: Transform): Size {
  const cropped = transform.crop ?? source
  const isSideways = transform.rotation === 90 || transform.rotation === 270
  return isSideways ? { width: cropped.height, height: cropped.width } : { width: cropped.width, height: cropped.height }
}
