import { unzlibSync } from 'fflate'
import { describe, expect, it } from 'vitest'
import { encodeRgbPng } from './png'

function readChunks(png: Uint8Array) {
  const view = new DataView(png.buffer, png.byteOffset, png.byteLength)
  const chunks: { type: string; data: Uint8Array }[] = []
  let offset = 8
  while (offset < png.length) {
    const length = view.getUint32(offset)
    const type = String.fromCharCode(...png.subarray(offset + 4, offset + 8))
    chunks.push({ type, data: png.subarray(offset + 8, offset + 8 + length) })
    offset += 12 + length
  }
  return chunks
}

/** Reverses the PNG row filters, returning the raw RGB bytes. */
function unfilter(data: Uint8Array, width: number, height: number): Uint8Array {
  const stride = width * 3
  const out = new Uint8Array(stride * height)
  for (let y = 0; y < height; y++) {
    const filter = data[y * (stride + 1)]
    for (let i = 0; i < stride; i++) {
      const raw = data[y * (stride + 1) + 1 + i]
      const left = i >= 3 ? out[y * stride + i - 3] : 0
      const up = y > 0 ? out[(y - 1) * stride + i] : 0
      const upLeft = i >= 3 && y > 0 ? out[(y - 1) * stride + i - 3] : 0
      let predictor = 0
      if (filter === 1) predictor = left
      else if (filter === 2) predictor = up
      else if (filter === 3) predictor = (left + up) >> 1
      else if (filter === 4) {
        const p = left + up - upLeft
        const pa = Math.abs(p - left)
        const pb = Math.abs(p - up)
        const pc = Math.abs(p - upLeft)
        predictor = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft
      }
      out[y * stride + i] = (raw + predictor) & 0xff
    }
  }
  return out
}

describe('encodeRgbPng', () => {
  it('writes an 8-bit RGB PNG whose pixels decode back to the input', () => {
    const width = 7
    const height = 5
    const rgba = new Uint8Array(width * height * 4)
    for (let i = 0; i < width * height; i++) rgba.set([(i * 37) % 256, (i * 11) % 256, 255 - i, i % 2 ? 255 : 0], i * 4)

    const png = encodeRgbPng(width, height, rgba)
    expect([...png.subarray(0, 8)]).toEqual([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

    const chunks = readChunks(png)
    expect(chunks.map((c) => c.type)).toEqual(['IHDR', 'IDAT', 'IEND'])
    const header = new DataView(chunks[0].data.buffer, chunks[0].data.byteOffset)
    expect(header.getUint32(0)).toBe(width)
    expect(header.getUint32(4)).toBe(height)
    expect(chunks[0].data[8]).toBe(8)
    expect(chunks[0].data[9]).toBe(2)

    const rgb = unfilter(unzlibSync(chunks[1].data), width, height)
    const expected = new Uint8Array(width * height * 3)
    for (let i = 0; i < width * height; i++) expected.set(rgba.subarray(i * 4, i * 4 + 3), i * 3)
    expect([...rgb]).toEqual([...expected])
  })

  it('writes a valid CRC for the IEND chunk', () => {
    const png = encodeRgbPng(1, 1, new Uint8Array([1, 2, 3, 255]))
    expect([...png.subarray(png.length - 4)]).toEqual([0xae, 0x42, 0x60, 0x82])
  })

  it('rejects pixel data of the wrong length', () => {
    expect(() => encodeRgbPng(2, 2, new Uint8Array(4))).toThrow()
  })
})
