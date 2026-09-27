import { ascii, asciiBytes, concatBytes, readUint16BE, readUint32BE, readUint32LE, startsWith, writeUint32LE } from './bytes'
import type { ImageFormatId } from './detectFormat'
import { pngChunkBytes } from './pngChunk'

export interface StripResult {
  bytes: Uint8Array
  /** Human-readable list of what was removed. */
  removed: string[]
  /** The EXIF orientation was kept so the picture is not shown sideways. */
  keptOrientation: boolean
}

export const STRIPPABLE_FORMATS: ImageFormatId[] = ['jpeg', 'png', 'webp']

export function canStrip(format: ImageFormatId | undefined) {
  return format !== undefined && STRIPPABLE_FORMATS.includes(format)
}

/**
 * Removes metadata without re-encoding the pixels, so there is no quality loss.
 * Colour profiles are kept so colours look the same. When `orientation` is
 * given (and not 1), a minimal EXIF block with only that value is written back.
 */
export function stripMetadata(bytes: Uint8Array, format: ImageFormatId, orientation?: number): StripResult {
  const keep = orientation !== undefined && orientation > 1 && orientation <= 8 ? orientation : undefined
  switch (format) {
    case 'jpeg':
      return stripJpeg(bytes, keep)
    case 'png':
      return stripPng(bytes, keep)
    case 'webp':
      return stripWebp(bytes, keep)
    default:
      throw new Error(`Removing metadata from ${format} files is not supported.`)
  }
}

/** A big-endian TIFF block holding only the Orientation tag. */
export function orientationOnlyTiff(orientation: number) {
  return new Uint8Array([
    0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8, // header, IFD0 at offset 8
    0, 1, // one entry
    0x01, 0x12, 0, 3, 0, 0, 0, 1, 0, orientation, 0, 0, // Orientation, SHORT, count 1
    0, 0, 0, 0, // no next IFD
  ])
}

function describeJpegSegment(marker: number, payload: Uint8Array) {
  if (marker === 0xfe) return 'Comment'
  if (marker === 0xe1) {
    if (startsWith(payload, 'Exif\0')) return 'EXIF (camera, dates, GPS, thumbnail)'
    if (startsWith(payload, 'http://ns.adobe.com/xap/1.0/')) return 'XMP'
    if (startsWith(payload, 'http://ns.adobe.com/xmp/extension/')) return 'Extended XMP'
    return 'APP1 data'
  }
  if (marker === 0xe2) return startsWith(payload, 'MPF\0') ? 'Multi-picture index (MPF)' : 'APP2 data'
  if (marker === 0xeb) return 'JUMBF / C2PA Content Credentials'
  if (marker === 0xed) return 'IPTC / Photoshop data'
  return `APP${marker - 0xe0} data`
}

function keepJpegSegment(marker: number, payload: Uint8Array) {
  if (marker === 0xe0) return startsWith(payload, 'JFIF\0') // drop JFXX thumbnails and others
  if (marker === 0xe2) return startsWith(payload, 'ICC_PROFILE\0')
  // Adobe APP14 tells decoders how to interpret CMYK/YCCK colours.
  if (marker === 0xee) return startsWith(payload, 'Adobe')
  return !(marker >= 0xe1 && marker <= 0xef) && marker !== 0xfe
}

function stripJpeg(bytes: Uint8Array, orientation: number | undefined): StripResult {
  if (!startsWith(bytes, [0xff, 0xd8])) throw new Error('Not a valid JPEG file.')
  const output: Uint8Array[] = [bytes.subarray(0, 2)]
  const removed: string[] = []
  let orientationInserted = orientation === undefined
  const insertOrientation = () => {
    if (orientationInserted) return
    const payload = concatBytes([asciiBytes('Exif\0\0'), orientationOnlyTiff(orientation!)])
    output.push(new Uint8Array([0xff, 0xe1, (payload.length + 2) >> 8, (payload.length + 2) & 0xff]), payload)
    orientationInserted = true
  }

  let offset = 2
  while (offset < bytes.length) {
    if (bytes[offset] !== 0xff) throw new Error('Unexpected data in the JPEG structure.')
    const marker = bytes[offset + 1]
    if (marker === 0xff) {
      offset++ // fill byte
      continue
    }
    if (marker === 0xd9) {
      output.push(bytes.subarray(offset, offset + 2))
      offset += 2
      break
    }
    const length = readUint16BE(bytes, offset + 2)
    const segmentEnd = offset + 2 + length
    const payload = bytes.subarray(offset + 4, segmentEnd)
    if (marker !== 0xe0) insertOrientation()
    if (keepJpegSegment(marker, payload)) {
      output.push(bytes.subarray(offset, segmentEnd))
    } else {
      removed.push(describeJpegSegment(marker, payload))
    }
    offset = segmentEnd
    if (marker === 0xda) {
      // Copy entropy-coded data up to the next real marker (not 0xFF00 stuffing or RSTn).
      let scan = offset
      while (scan < bytes.length - 1) {
        if (bytes[scan] === 0xff) {
          const next = bytes[scan + 1]
          if (next !== 0x00 && !(next >= 0xd0 && next <= 0xd7) && next !== 0xff) break
        }
        scan++
      }
      // A truncated file without an end marker: keep what is there.
      if (scan >= bytes.length - 1) scan = bytes.length
      output.push(bytes.subarray(offset, scan))
      offset = scan
    }
  }
  if (offset < bytes.length) removed.push('Data after the image (extra images, motion-photo video or HDR gain map)')

  return { bytes: concatBytes(output), removed: [...new Set(removed)], keptOrientation: orientation !== undefined }
}

const PNG_REMOVED_CHUNKS: Record<string, string> = {
  eXIf: 'EXIF',
  tEXt: 'Text',
  zTXt: 'Compressed text',
  iTXt: 'International text (may contain XMP)',
  tIME: 'Modification time',
  caBX: 'C2PA Content Credentials',
  dSIG: 'Digital signature',
}

function stripPng(bytes: Uint8Array, orientation: number | undefined): StripResult {
  const output: Uint8Array[] = [bytes.subarray(0, 8)]
  const removed: string[] = []
  let offset = 8
  while (offset + 12 <= bytes.length) {
    const length = readUint32BE(bytes, offset)
    const type = ascii(bytes, offset + 4, 4)
    const end = offset + 12 + length
    if (PNG_REMOVED_CHUNKS[type]) {
      const text = type === 'tEXt' || type === 'iTXt' || type === 'zTXt' ? `: ${ascii(bytes, offset + 8, Math.min(length, 79)).split('\0')[0]}` : ''
      removed.push(`${PNG_REMOVED_CHUNKS[type]}${text}`)
    } else {
      if (type === 'IDAT' && orientation !== undefined && !output.some((part) => ascii(part, 4, 4) === 'eXIf')) {
        output.push(pngChunkBytes('eXIf', orientationOnlyTiff(orientation)))
      }
      output.push(bytes.subarray(offset, end))
    }
    offset = end
    if (type === 'IEND') break
  }
  if (offset < bytes.length) removed.push('Data after the image')
  return { bytes: concatBytes(output), removed: [...new Set(removed)], keptOrientation: orientation !== undefined }
}

const VP8X_EXIF_FLAG = 0x08
const VP8X_XMP_FLAG = 0x04

function stripWebp(bytes: Uint8Array, orientation: number | undefined): StripResult {
  const chunks: Uint8Array[] = []
  const removed: string[] = []
  let offset = 12
  const riffEnd = Math.min(bytes.length, 8 + readUint32LE(bytes, 4))
  while (offset + 8 <= riffEnd) {
    const type = ascii(bytes, offset, 4)
    const length = readUint32LE(bytes, offset + 4)
    const end = offset + 8 + length + (length % 2)
    if (type === 'EXIF') removed.push('EXIF')
    else if (type === 'XMP ') removed.push('XMP')
    else if (type === 'C2PA') removed.push('C2PA Content Credentials')
    else chunks.push(bytes.slice(offset, end))
    offset = end
  }

  const vp8x = chunks.find((chunk) => ascii(chunk, 0, 4) === 'VP8X')
  const canKeepOrientation = orientation !== undefined && vp8x !== undefined
  if (vp8x) {
    vp8x[8] &= ~(VP8X_EXIF_FLAG | VP8X_XMP_FLAG)
    if (canKeepOrientation) {
      vp8x[8] |= VP8X_EXIF_FLAG
      const tiff = orientationOnlyTiff(orientation!)
      const chunk = new Uint8Array(8 + tiff.length)
      chunk.set(asciiBytes('EXIF'))
      writeUint32LE(chunk, 4, tiff.length)
      chunk.set(tiff, 8)
      chunks.push(chunk) // EXIF goes after the image data
    }
  }

  const body = concatBytes([asciiBytes('WEBP'), ...chunks])
  const header = new Uint8Array(8)
  header.set(asciiBytes('RIFF'))
  writeUint32LE(header, 4, body.length)
  return { bytes: concatBytes([header, body]), removed, keptOrientation: canKeepOrientation }
}

/** `holiday.jpg` → `holiday-clean.jpg` */
export function cleanFileName(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? `${fileName.slice(0, dot)}-clean${fileName.slice(dot)}` : `${fileName}-clean`
}
