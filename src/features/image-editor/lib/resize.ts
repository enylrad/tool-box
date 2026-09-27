import type { Size } from '../../../lib/cropGeometry'

export type ResizeMode = 'original' | 'percent' | 'custom'

export interface ResizeSettings {
  mode: ResizeMode
  /** Scale of the cropped area, from 1 to `MAX_PERCENT`. */
  percent: number
  /** Target size in custom mode. With `keepAspect`, the output fits inside it. */
  width: number
  height: number
  keepAspect: boolean
}

export const DEFAULT_RESIZE: ResizeSettings = { mode: 'original', percent: 50, width: 1920, height: 1080, keepAspect: true }

export const MAX_PERCENT = 200
/** Browsers refuse canvases above these limits (Safari is the strictest on area). */
export const MAX_SIDE = 16384
export const MAX_PIXELS = 100_000_000

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

/** Keeps a stored number finite, whole and inside a range. */
export function clampInteger(value: unknown, min: number, max: number, fallback: number): number {
  return typeof value === 'number' && Number.isFinite(value) ? clamp(Math.round(value), min, max) : fallback
}

/** Shrinks a size, keeping its proportions, until a canvas can hold it. */
export function limitSize({ width, height }: Size): Size {
  const scale = Math.min(1, MAX_SIDE / width, MAX_SIDE / height, Math.sqrt(MAX_PIXELS / (width * height)))
  return {
    width: clamp(Math.round(width * scale), 1, MAX_SIDE),
    height: clamp(Math.round(height * scale), 1, MAX_SIDE),
  }
}

/** Final pixel size of the exported image, given the size of the cropped area. */
export function computeOutputSize(source: Size, settings: ResizeSettings): Size {
  switch (settings.mode) {
    case 'original':
      return limitSize(source)
    case 'percent': {
      const scale = clamp(settings.percent, 1, MAX_PERCENT) / 100
      return limitSize({ width: source.width * scale, height: source.height * scale })
    }
    case 'custom': {
      const width = clamp(settings.width, 1, MAX_SIDE)
      const height = clamp(settings.height, 1, MAX_SIDE)
      if (!settings.keepAspect) return limitSize({ width, height })
      const scale = Math.min(width / source.width, height / source.height)
      return limitSize({ width: source.width * scale, height: source.height * scale })
    }
  }
}

export interface AspectPreset {
  id: string
  label: string
  /** Width / height, `null` for a free crop, `'original'` for the image's own ratio. */
  ratio: number | null | 'original'
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: 'original', label: 'Original', ratio: 'original' },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
  { id: '3:2', label: '3:2', ratio: 3 / 2 },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '3:4', label: '3:4', ratio: 3 / 4 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
]

/** The aspect ratio a preset locks the crop to, or `null` for a free crop. */
export function presetRatio(presetId: string, image: Size): number | null {
  const ratio = ASPECT_PRESETS.find((preset) => preset.id === presetId)?.ratio ?? null
  return ratio === 'original' ? image.width / image.height : ratio
}

/** The largest size with the proportions of `content` that fits inside `box`. */
export function fitInside(content: Size, box: Size): Size {
  if (content.width <= 0 || content.height <= 0 || box.width <= 0 || box.height <= 0) return { width: 0, height: 0 }
  const scale = Math.min(box.width / content.width, box.height / content.height)
  return { width: Math.floor(content.width * scale), height: Math.floor(content.height * scale) }
}
