import { formatBytes } from '../../../lib/formatBytes'
import { describeFormat, type ImageFormat } from './detectFormat'
import { formatAspectRatio, formatExifDate, formatLocalDate, formatMegapixels } from './formatValues'
import type { InfoRow } from './infoRows'
import { tagNumber, tagText, type MetadataTags, type TagGroupName } from './tags'

export interface FileFacts {
  name: string
  size: number
  type: string
  lastModified: number
}

export interface Dimensions {
  width: number
  height: number
}

/** Pixel size stored in the file header, falling back to EXIF and then to the decoded image. */
export function readDimensions(tags: MetadataTags, decoded: Dimensions | null): Dimensions | null {
  const candidates: [string, string, TagGroupName[]][] = [
    ['Image Width', 'Image Height', ['file', 'pngFile', 'gif']],
    ['ImageWidth', 'ImageHeight', ['riff']],
    ['PixelXDimension', 'PixelYDimension', ['exif']],
    ['ImageWidth', 'ImageLength', ['exif']],
  ]
  for (const [widthName, heightName, groups] of candidates) {
    const width = tagNumber(tags, widthName, groups)
    const height = tagNumber(tags, heightName, groups)
    if (width && height) return { width, height }
  }
  return decoded
}

/** Orientation values 5–8 mean the image is displayed rotated by 90°. */
export function isRotatedSideways(tags: MetadataTags) {
  const orientation = tagNumber(tags, 'Orientation', ['exif'])
  return orientation !== undefined && orientation >= 5 && orientation <= 8
}

const ORIENTATION_NAMES: Record<number, string> = {
  1: 'Normal',
  2: 'Mirrored horizontally',
  3: 'Rotated 180°',
  4: 'Mirrored vertically',
  5: 'Mirrored and rotated 90° counter-clockwise',
  6: 'Rotated 90° clockwise',
  7: 'Mirrored and rotated 90° clockwise',
  8: 'Rotated 90° counter-clockwise',
}

function colorSpace(tags: MetadataTags) {
  const profile = tagText(tags, ['Profile Description', 'ICC Description'], ['icc'])
  const exifSpace = tagText(tags, 'ColorSpace', ['exif'])
  const pngType = tagText(tags, 'Color Type', ['pngFile'])
  return profile ?? (exifSpace === 'Uncalibrated' ? undefined : exifSpace) ?? pngType
}

function bitDepth(tags: MetadataTags) {
  const bits = tagNumber(tags, ['Bits Per Sample', 'Bit Depth'], ['file', 'pngFile']) ?? tagNumber(tags, 'BitsPerSample', ['exif'])
  return bits ? `${bits} bits per channel` : undefined
}

function resolution(tags: MetadataTags) {
  const x = tagNumber(tags, 'XResolution', ['exif'])
  const unit = tagText(tags, 'ResolutionUnit', ['exif'])
  if (!x) return undefined
  return unit === 'centimeters' ? `${Math.round(x)} dots per cm` : `${Math.round(x)} DPI`
}

export interface CaptureDates {
  captured?: string
  digitized?: string
  modified?: string
}

export function readCaptureDates(tags: MetadataTags): CaptureDates {
  const withZone = (dateTag: string, offsetTag: string, subSecTag: string) => {
    const date = tagText(tags, dateTag, ['exif'])
    return date ? formatExifDate(date, tagText(tags, offsetTag, ['exif']), tagText(tags, subSecTag, ['exif'])) : undefined
  }
  const xmpDate = (name: string) => {
    const date = tagText(tags, name, ['xmp'])
    return date ? formatExifDate(date) : undefined
  }
  return {
    captured: withZone('DateTimeOriginal', 'OffsetTimeOriginal', 'SubSecTimeOriginal') ?? xmpDate('DateTimeOriginal') ?? xmpDate('DateCreated'),
    digitized: withZone('DateTimeDigitized', 'OffsetTimeDigitized', 'SubSecTimeDigitized') ?? xmpDate('CreateDate'),
    modified: withZone('DateTime', 'OffsetTime', 'SubSecTime') ?? xmpDate('ModifyDate'),
  }
}

export function readBasicInfo(file: FileFacts, format: ImageFormat | null, tags: MetadataTags, decoded: Dimensions | null): InfoRow[] {
  const dimensions = readDimensions(tags, decoded)
  const dates = readCaptureDates(tags)
  const orientation = tagNumber(tags, 'Orientation', ['exif'])
  const iccName = tagText(tags, ['Profile Description', 'ICC Description'], ['icc'])

  return [
    { label: 'File name', value: file.name },
    { label: 'File size', value: formatBytes(file.size), hint: `${file.size.toLocaleString('en-US')} bytes` },
    { label: 'Format', value: format ? describeFormat(format, file.name) : 'Unknown', hint: file.type || undefined },
    {
      label: 'Dimensions',
      value: dimensions ? `${dimensions.width} × ${dimensions.height} px` : undefined,
      hint: dimensions ? formatMegapixels(dimensions.width, dimensions.height) : undefined,
    },
    { label: 'Aspect ratio', value: dimensions ? formatAspectRatio(dimensions.width, dimensions.height) : undefined },
    { label: 'Orientation', value: orientation ? ORIENTATION_NAMES[orientation] : undefined },
    { label: 'Color', value: colorSpace(tags), hint: iccName ? 'ICC profile' : undefined },
    { label: 'Bit depth', value: bitDepth(tags) },
    { label: 'Resolution', value: resolution(tags) },
    { label: 'Taken', value: dates.captured },
    { label: 'Digitized', value: dates.digitized !== dates.captured ? dates.digitized : undefined },
    { label: 'Last edited (metadata)', value: dates.modified },
    {
      label: 'File date',
      value: file.lastModified ? formatLocalDate(file.lastModified) : undefined,
      hint: 'from your device, not the photo',
    },
  ]
}
