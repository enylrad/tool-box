import { toFileName } from '../../../lib/download'

export type OutputFormat = 'png' | 'jpeg' | 'webp'

interface OutputFormatInfo {
  label: string
  mimeType: string
  extension: string
  /** Lossy formats take a quality setting. */
  isLossy: boolean
}

export const OUTPUT_FORMATS: Record<OutputFormat, OutputFormatInfo> = {
  png: { label: 'PNG', mimeType: 'image/png', extension: 'png', isLossy: false },
  jpeg: { label: 'JPEG', mimeType: 'image/jpeg', extension: 'jpg', isLossy: true },
  webp: { label: 'WebP', mimeType: 'image/webp', extension: 'webp', isLossy: true },
}

export const OUTPUT_FORMAT_IDS = Object.keys(OUTPUT_FORMATS) as OutputFormat[]

export interface OutputSettings {
  format: OutputFormat
  /** Quality for lossy formats, from 0.1 to 1. */
  quality: number
}

export const DEFAULT_OUTPUT: OutputSettings = { format: 'jpeg', quality: 0.9 }

const MIME_LABELS: Record<string, string> = {
  'image/jpeg': 'JPEG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/gif': 'GIF',
  'image/avif': 'AVIF',
  'image/bmp': 'BMP',
  'image/svg+xml': 'SVG',
  'image/x-icon': 'ICO',
  'image/vnd.microsoft.icon': 'ICO',
  'image/tiff': 'TIFF',
}

/** Short format name for a MIME type, e.g. `image/jpeg` → `JPEG`. */
export function formatLabel(mimeType: string): string {
  if (MIME_LABELS[mimeType]) return MIME_LABELS[mimeType]
  const subtype = mimeType.split('/')[1]
  return subtype ? subtype.toUpperCase() : 'Unknown'
}

/** `IMG_1234.JPG` → `img-1234-edited.webp`. */
export function outputFileName(originalName: string, extension: string): string {
  const baseName = originalName.replace(/\.[^.]*$/, '')
  return toFileName(`${baseName} edited`, extension, 'image')
}

/** Relative change from `before` to `after` bytes, e.g. `−87%` or `+12%`. */
export function sizeChange(before: number, after: number): string {
  if (before <= 0) return ''
  const percent = Math.round(((after - before) / before) * 100)
  if (percent === 0) return '±0%'
  return percent > 0 ? `+${percent}%` : `−${Math.abs(percent)}%`
}

/** File extension for an encoded blob's MIME type. */
export function extensionFor(mimeType: string): string {
  return Object.values(OUTPUT_FORMATS).find((format) => format.mimeType === mimeType)?.extension ?? 'png'
}
