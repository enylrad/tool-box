import { describe, expect, it } from 'vitest'
import { ascii, asciiBytes, indexOfAscii } from './bytes'
import { canStrip, cleanFileName, stripMetadata } from './stripMetadata'
import { readTags } from './tags'
import { buildJpeg, buildPng, buildTiff, buildWebp, pngChunk, SAMPLE_EXIF, SAMPLE_XMP, toArrayBuffer, webpChunk } from './testUtils'

describe('stripMetadata (JPEG)', () => {
  const original = buildJpeg({ exif: SAMPLE_EXIF, xmp: SAMPLE_XMP, icc: true, comment: 'secret note', trailer: asciiBytes('MOTION-VIDEO') })

  it('removes EXIF, XMP, comments and trailing data but keeps the image and ICC profile', async () => {
    const { bytes, removed } = stripMetadata(original, 'jpeg')
    const tags = await readTags(toArrayBuffer(bytes))
    expect(tags.exif).toBeUndefined()
    expect(tags.gps).toBeUndefined()
    expect(tags.xmp).toBeUndefined()
    expect(indexOfAscii(bytes, 'secret note')).toBe(-1)
    expect(indexOfAscii(bytes, 'MOTION-VIDEO')).toBe(-1)
    expect(indexOfAscii(bytes, 'ICC_PROFILE')).toBeGreaterThan(0)
    expect(indexOfAscii(bytes, 'JFIF')).toBeGreaterThan(0)
    // Entropy-coded data (with stuffing and restart markers) is copied untouched.
    const scan = [0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56, 0xff, 0xd9]
    expect([...bytes.subarray(bytes.length - scan.length)]).toEqual(scan)
    expect(removed).toEqual(
      expect.arrayContaining(['EXIF (camera, dates, GPS, thumbnail)', 'XMP', 'Comment', expect.stringContaining('Data after the image')]),
    )
  })

  it('can write back only the orientation', async () => {
    const { bytes, keptOrientation } = stripMetadata(original, 'jpeg', 6)
    expect(keptOrientation).toBe(true)
    const tags = await readTags(toArrayBuffer(bytes))
    expect(tags.exif?.Orientation?.value).toBe(6)
    expect(tags.exif?.Make).toBeUndefined()
    expect(tags.gps).toBeUndefined()
  })

  it('rejects files that are not JPEG', () => {
    expect(() => stripMetadata(buildPng(), 'jpeg')).toThrow()
  })
})

describe('stripMetadata (PNG)', () => {
  const original = buildPng([
    pngChunk('iCCP', asciiBytes('sRGB\0\0x')),
    pngChunk('eXIf', buildTiff(SAMPLE_EXIF)),
    pngChunk('tEXt', asciiBytes('Author\0Jane Doe')),
    pngChunk('tIME', new Uint8Array(7)),
  ])

  it('removes text, EXIF and time chunks and keeps the colour profile', async () => {
    const { bytes, removed } = stripMetadata(original, 'png')
    expect(removed).toEqual(['EXIF', 'Text: Author', 'Modification time'])
    expect(indexOfAscii(bytes, 'Jane Doe')).toBe(-1)
    expect(indexOfAscii(bytes, 'iCCP')).toBeGreaterThan(0)
    const tags = await readTags(toArrayBuffer(bytes))
    expect(tags.exif).toBeUndefined()
    expect(tags.gps).toBeUndefined()
  })

  it('writes the orientation before the image data', async () => {
    const { bytes } = stripMetadata(original, 'png', 8)
    expect(indexOfAscii(bytes, 'eXIf')).toBeLessThan(indexOfAscii(bytes, 'IDAT'))
    const tags = await readTags(toArrayBuffer(bytes))
    expect(tags.exif?.Orientation?.value).toBe(8)
    expect(tags.exif?.Make).toBeUndefined()
  })
})

describe('stripMetadata (WebP)', () => {
  const original = buildWebp(0x08 | 0x04, [
    webpChunk('EXIF', buildTiff(SAMPLE_EXIF)),
    webpChunk('XMP ', asciiBytes(SAMPLE_XMP)),
  ])

  it('drops EXIF and XMP chunks, clears their flags and fixes the RIFF size', () => {
    const { bytes, removed } = stripMetadata(original, 'webp')
    expect(removed).toEqual(['EXIF', 'XMP'])
    expect(ascii(bytes, 0, 4)).toBe('RIFF')
    expect(new DataView(bytes.buffer).getUint32(4, true)).toBe(bytes.length - 8)
    expect(bytes[20] & 0x0c).toBe(0)
    expect(indexOfAscii(bytes, 'EXIF')).toBe(-1)
  })

  it('keeps the orientation in a new EXIF chunk', async () => {
    const { bytes, keptOrientation } = stripMetadata(original, 'webp', 3)
    expect(keptOrientation).toBe(true)
    expect(bytes[20] & 0x08).toBe(0x08)
    const tags = await readTags(toArrayBuffer(bytes))
    expect(tags.exif?.Orientation?.value).toBe(3)
  })
})

describe('helpers', () => {
  it('knows which formats can be cleaned', () => {
    expect(canStrip('jpeg')).toBe(true)
    expect(canStrip('heic')).toBe(false)
    expect(canStrip(undefined)).toBe(false)
  })

  it('builds the clean file name', () => {
    expect(cleanFileName('IMG_0001.JPG')).toBe('IMG_0001-clean.JPG')
    expect(cleanFileName('photo')).toBe('photo-clean')
  })
})

