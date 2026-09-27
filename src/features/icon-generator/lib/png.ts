import { zlibSync } from 'fflate'

const SIGNATURE = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]
const COLOR_TYPE_RGB = 2
const BYTES_PER_PIXEL = 3

let crcTable: Uint32Array | null = null

function crc32(bytes: Uint8Array): number {
  if (!crcTable) {
    crcTable = new Uint32Array(256)
    for (let n = 0; n < 256; n++) {
      let c = n
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      crcTable[n] = c >>> 0
    }
  }
  let crc = 0xffffffff
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function chunk(type: string, data: Uint8Array): Uint8Array {
  const bytes = new Uint8Array(12 + data.length)
  const view = new DataView(bytes.buffer)
  view.setUint32(0, data.length)
  for (let i = 0; i < 4; i++) bytes[4 + i] = type.charCodeAt(i)
  bytes.set(data, 8)
  view.setUint32(8 + data.length, crc32(bytes.subarray(4, 8 + data.length)))
  return bytes
}

function paeth(left: number, up: number, upLeft: number): number {
  const estimate = left + up - upLeft
  const toLeft = Math.abs(estimate - left)
  const toUp = Math.abs(estimate - up)
  const toUpLeft = Math.abs(estimate - upLeft)
  if (toLeft <= toUp && toLeft <= toUpLeft) return left
  return toUp <= toUpLeft ? up : upLeft
}

/** Applies the PNG filter (0–4) that makes each row smallest, the usual heuristic of PNG encoders. */
function filterRows(rgb: Uint8Array, width: number, height: number): Uint8Array {
  const stride = width * BYTES_PER_PIXEL
  const output = new Uint8Array((stride + 1) * height)
  const candidate = new Uint8Array(stride)
  const empty = new Uint8Array(stride)

  for (let y = 0; y < height; y++) {
    const row = rgb.subarray(y * stride, (y + 1) * stride)
    const previous = y > 0 ? rgb.subarray((y - 1) * stride, y * stride) : empty
    let bestFilter = 0
    let bestScore = Infinity
    let best = row as Uint8Array

    for (let filter = 0; filter <= 4; filter++) {
      const target = filter === 0 ? row : candidate
      let score = 0
      for (let i = 0; i < stride; i++) {
        const left = i >= BYTES_PER_PIXEL ? row[i - BYTES_PER_PIXEL] : 0
        const up = previous[i]
        const upLeft = i >= BYTES_PER_PIXEL ? previous[i - BYTES_PER_PIXEL] : 0
        let value = row[i]
        if (filter === 1) value -= left
        else if (filter === 2) value -= up
        else if (filter === 3) value -= (left + up) >> 1
        else if (filter === 4) value -= paeth(left, up, upLeft)
        value &= 0xff
        if (filter !== 0) target[i] = value
        score += value < 128 ? value : 256 - value
      }
      if (score < bestScore) {
        bestScore = score
        bestFilter = filter
        best = filter === 0 ? row : candidate.slice()
      }
    }

    output[y * (stride + 1)] = bestFilter
    output.set(best, y * (stride + 1) + 1)
  }
  return output
}

/**
 * Encodes RGBA pixels (e.g. from `getImageData`) as a PNG without an alpha
 * channel. The App Store rejects icons whose PNG has one, even when every
 * pixel is opaque, and canvas `toBlob` always writes RGBA.
 */
export function encodeRgbPng(width: number, height: number, rgba: Uint8Array | Uint8ClampedArray): Uint8Array<ArrayBuffer> {
  if (rgba.length !== width * height * 4) throw new Error('Pixel data does not match the image size')
  const rgb = new Uint8Array(width * height * BYTES_PER_PIXEL)
  for (let source = 0, target = 0; source < rgba.length; source += 4, target += 3) {
    rgb[target] = rgba[source]
    rgb[target + 1] = rgba[source + 1]
    rgb[target + 2] = rgba[source + 2]
  }

  const header = new Uint8Array(13)
  const headerView = new DataView(header.buffer)
  headerView.setUint32(0, width)
  headerView.setUint32(4, height)
  header[8] = 8 // bit depth
  header[9] = COLOR_TYPE_RGB
  // Compression, filter and interlace methods are all 0.

  const parts = [
    new Uint8Array(SIGNATURE),
    chunk('IHDR', header),
    chunk('IDAT', zlibSync(filterRows(rgb, width, height), { level: 9 })),
    chunk('IEND', new Uint8Array(0)),
  ]
  const png = new Uint8Array(parts.reduce((total, part) => total + part.length, 0))
  let offset = 0
  for (const part of parts) {
    png.set(part, offset)
    offset += part.length
  }
  return png
}
