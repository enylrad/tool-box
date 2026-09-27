import { describe, expect, it } from 'vitest'
import { asciiBytes, concatBytes } from './bytes'
import { describeFormat, detectFormat, formatMismatch } from './detectFormat'
import { buildJpeg, buildPng, buildWebp } from './testUtils'

function ftyp(major: string, ...compatible: string[]) {
  const size = 16 + compatible.length * 4
  return concatBytes([new Uint8Array([0, 0, 0, size]), asciiBytes(`ftyp${major}\0\0\0\0${compatible.join('')}`)])
}

describe('detectFormat', () => {
  it('recognizes common image signatures', () => {
    expect(detectFormat(buildJpeg())?.id).toBe('jpeg')
    expect(detectFormat(buildPng())?.id).toBe('png')
    expect(detectFormat(buildWebp(0, []))?.id).toBe('webp')
    expect(detectFormat(asciiBytes('GIF89a....'))?.id).toBe('gif')
    expect(detectFormat(asciiBytes('BM......'))?.id).toBe('bmp')
    expect(detectFormat(asciiBytes('<?xml version="1.0"?>\n<svg xmlns="http://www.w3.org/2000/svg">'))?.id).toBe('svg')
  })

  it('tells HEIC, AVIF and CR3 apart by their ftyp brands', () => {
    expect(detectFormat(ftyp('heic', 'mif1', 'heic'))?.id).toBe('heic')
    expect(detectFormat(ftyp('avif', 'mif1'))?.id).toBe('avif')
    expect(detectFormat(ftyp('mif1', 'avif', 'miaf'))?.id).toBe('avif')
    expect(detectFormat(ftyp('crx ', 'crx '))?.id).toBe('cr3')
    expect(detectFormat(ftyp('isom', 'mp41'))).toBeNull()
  })

  it('recognizes TIFF and TIFF-based RAW files', () => {
    expect(detectFormat(new Uint8Array([0x49, 0x49, 0x2a, 0, 8, 0, 0, 0, 0x43, 0x52]))?.id).toBe('cr2')
    const tiff = detectFormat(new Uint8Array([0x4d, 0x4d, 0, 0x2a, 0, 0, 0, 8]))!
    expect(tiff.id).toBe('tiff')
    expect(describeFormat(tiff, 'DSC_0001.NEF')).toBe('Nikon RAW (NEF) (TIFF-based)')
    expect(describeFormat(tiff, 'scan.tif')).toBe('TIFF')
  })

  it('returns null for unknown content', () => {
    expect(detectFormat(asciiBytes('hello world'))).toBeNull()
  })
})

describe('formatMismatch', () => {
  it('warns when the extension lies about the content', () => {
    const png = detectFormat(buildPng())
    expect(formatMismatch(png, 'photo.jpg')).toContain('actually PNG')
    expect(formatMismatch(png, 'photo.PNG')).toBeNull()
    expect(formatMismatch(png, 'photo')).toBeNull()
  })
})
