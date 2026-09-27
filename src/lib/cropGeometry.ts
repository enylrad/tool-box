export interface Size {
  width: number
  height: number
}

export interface CropRect extends Size {
  x: number
  y: number
}

export type CropHandle = 'move' | 'nw' | 'ne' | 'sw' | 'se'

export const MIN_CROP_SIZE = 16

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Rounds to whole pixels and keeps the rectangle inside the frame. */
export function clampCrop(rect: CropRect, frame: Size): CropRect {
  const width = clamp(Math.round(rect.width), Math.min(MIN_CROP_SIZE, frame.width), frame.width)
  const height = clamp(Math.round(rect.height), Math.min(MIN_CROP_SIZE, frame.height), frame.height)
  return {
    x: clamp(Math.round(rect.x), 0, frame.width - width),
    y: clamp(Math.round(rect.y), 0, frame.height - height),
    width,
    height,
  }
}

/** The largest rectangle with the given aspect ratio (width / height) centred in the frame. */
export function centeredCrop(frame: Size, aspectRatio: number | null): CropRect {
  if (aspectRatio === null) return { x: 0, y: 0, width: frame.width, height: frame.height }
  let width = frame.width
  let height = width / aspectRatio
  if (height > frame.height) {
    height = frame.height
    width = height * aspectRatio
  }
  return clampCrop({ x: (frame.width - width) / 2, y: (frame.height - height) / 2, width, height }, frame)
}

/**
 * Applies a pointer drag of (dx, dy) source pixels to the crop rectangle as it
 * was when the drag started. Corners resize around the opposite corner and keep
 * `aspectRatio` when one is given.
 */
export function dragCrop(
  start: CropRect,
  handle: CropHandle,
  dx: number,
  dy: number,
  frame: Size,
  aspectRatio: number | null,
): CropRect {
  if (handle === 'move') {
    return clampCrop({ ...start, x: start.x + dx, y: start.y + dy }, frame)
  }

  const growsRight = handle === 'ne' || handle === 'se'
  const growsDown = handle === 'sw' || handle === 'se'
  const anchorX = growsRight ? start.x : start.x + start.width
  const anchorY = growsDown ? start.y : start.y + start.height
  const maxWidth = growsRight ? frame.width - anchorX : anchorX
  const maxHeight = growsDown ? frame.height - anchorY : anchorY
  const minSize = Math.min(MIN_CROP_SIZE, maxWidth, maxHeight)

  let width = clamp(start.width + (growsRight ? dx : -dx), minSize, maxWidth)
  let height = clamp(start.height + (growsDown ? dy : -dy), minSize, maxHeight)

  if (aspectRatio !== null) {
    // Follow whichever side the pointer moved further, then shrink to fit the frame.
    if (width / aspectRatio > height) height = width / aspectRatio
    else width = height * aspectRatio
    if (width > maxWidth) {
      width = maxWidth
      height = width / aspectRatio
    }
    if (height > maxHeight) {
      height = maxHeight
      width = height * aspectRatio
    }
  }

  return clampCrop(
    {
      x: growsRight ? anchorX : anchorX - width,
      y: growsDown ? anchorY : anchorY - height,
      width,
      height,
    },
    frame,
  )
}
