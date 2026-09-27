import { ascii, startsWith } from './bytes'

export type ImageFormatId =
  | 'jpeg'
  | 'png'
  | 'gif'
  | 'webp'
  | 'heic'
  | 'avif'
  | 'jxl'
  | 'tiff'
  | 'cr2'
  | 'cr3'
  | 'orf'
  | 'rw2'
  | 'raf'
  | 'bmp'
  | 'ico'
  | 'svg'

export interface ImageFormat {
  id: ImageFormatId
  name: string
  mime: string
  extensions: string[]
}

const FORMATS: Record<ImageFormatId, ImageFormat> = {
  jpeg: { id: 'jpeg', name: 'JPEG', mime: 'image/jpeg', extensions: ['jpg', 'jpeg', 'jpe', 'jfif'] },
  png: { id: 'png', name: 'PNG', mime: 'image/png', extensions: ['png', 'apng'] },
  gif: { id: 'gif', name: 'GIF', mime: 'image/gif', extensions: ['gif'] },
  webp: { id: 'webp', name: 'WebP', mime: 'image/webp', extensions: ['webp'] },
  heic: { id: 'heic', name: 'HEIC / HEIF', mime: 'image/heic', extensions: ['heic', 'heif', 'hif'] },
  avif: { id: 'avif', name: 'AVIF', mime: 'image/avif', extensions: ['avif'] },
  jxl: { id: 'jxl', name: 'JPEG XL', mime: 'image/jxl', extensions: ['jxl'] },
  // Most camera RAW formats (NEF, ARW, DNG, PEF, SRW…) are TIFF files inside.
  tiff: {
    id: 'tiff',
    name: 'TIFF',
    mime: 'image/tiff',
    extensions: ['tif', 'tiff', 'dng', 'nef', 'nrw', 'arw', 'srf', 'sr2', 'pef', 'srw', 'erf', '3fr', 'iiq', 'mos', 'x3f', 'rwl'],
  },
  cr2: { id: 'cr2', name: 'Canon RAW (CR2)', mime: 'image/x-canon-cr2', extensions: ['cr2'] },
  cr3: { id: 'cr3', name: 'Canon RAW (CR3)', mime: 'image/x-canon-cr3', extensions: ['cr3'] },
  orf: { id: 'orf', name: 'Olympus RAW (ORF)', mime: 'image/x-olympus-orf', extensions: ['orf'] },
  rw2: { id: 'rw2', name: 'Panasonic RAW (RW2)', mime: 'image/x-panasonic-rw2', extensions: ['rw2', 'raw'] },
  raf: { id: 'raf', name: 'Fujifilm RAW (RAF)', mime: 'image/x-fuji-raf', extensions: ['raf'] },
  bmp: { id: 'bmp', name: 'BMP', mime: 'image/bmp', extensions: ['bmp', 'dib'] },
  ico: { id: 'ico', name: 'ICO', mime: 'image/x-icon', extensions: ['ico', 'cur'] },
  svg: { id: 'svg', name: 'SVG', mime: 'image/svg+xml', extensions: ['svg', 'svgz'] },
}

const HEIF_BRANDS = ['heic', 'heix', 'hevc', 'hevx', 'heim', 'heis', 'hevm', 'hevs', 'mif1', 'msf1', 'mif2']
const AVIF_BRANDS = ['avif', 'avis']

const RAW_NAMES: Record<string, string> = {
  dng: 'Adobe DNG',
  nef: 'Nikon RAW (NEF)',
  nrw: 'Nikon RAW (NRW)',
  arw: 'Sony RAW (ARW)',
  srf: 'Sony RAW (SRF)',
  sr2: 'Sony RAW (SR2)',
  pef: 'Pentax RAW (PEF)',
  srw: 'Samsung RAW (SRW)',
  erf: 'Epson RAW (ERF)',
  '3fr': 'Hasselblad RAW (3FR)',
  iiq: 'Phase One RAW (IIQ)',
  mos: 'Leaf RAW (MOS)',
  x3f: 'Sigma RAW (X3F)',
  rwl: 'Leica RAW (RWL)',
}

/** Brands listed in an ISO-BMFF `ftyp` box (major brand first). */
function ftypBrands(bytes: Uint8Array) {
  const size = (bytes[0] << 24) | (bytes[1] << 16) | (bytes[2] << 8) | bytes[3]
  const end = Math.min(size > 0 ? size : 32, bytes.length)
  const brands = [ascii(bytes, 8, 4)]
  for (let offset = 16; offset + 4 <= end; offset += 4) brands.push(ascii(bytes, offset, 4))
  return brands
}

/** Identifies the real file format from its first bytes ("magic numbers"), ignoring the name. */
export function detectFormat(bytes: Uint8Array): ImageFormat | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return FORMATS.jpeg
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return FORMATS.png
  if (startsWith(bytes, 'GIF87a') || startsWith(bytes, 'GIF89a')) return FORMATS.gif
  if (startsWith(bytes, 'RIFF') && startsWith(bytes, 'WEBP', 8)) return FORMATS.webp
  if (startsWith(bytes, 'ftyp', 4)) {
    const [major, ...compatible] = ftypBrands(bytes)
    if (major === 'crx ') return FORMATS.cr3
    if (AVIF_BRANDS.includes(major)) return FORMATS.avif
    if (HEIF_BRANDS.includes(major)) {
      // mif1 is generic HEIF; AVIF files often use it as the major brand.
      return compatible.some((brand) => AVIF_BRANDS.includes(brand)) && !compatible.includes('heic')
        ? FORMATS.avif
        : FORMATS.heic
    }
    return null
  }
  if (startsWith(bytes, [0xff, 0x0a]) || startsWith(bytes, [0, 0, 0, 0x0c, 0x4a, 0x58, 0x4c, 0x20])) return FORMATS.jxl
  if (startsWith(bytes, 'IIRO') || startsWith(bytes, 'IIRS') || startsWith(bytes, 'MMOR')) return FORMATS.orf
  if (startsWith(bytes, [0x49, 0x49, 0x55, 0x00])) return FORMATS.rw2
  if (startsWith(bytes, 'FUJIFILMCCD-RAW')) return FORMATS.raf
  if (startsWith(bytes, [0x49, 0x49, 0x2a, 0x00]) || startsWith(bytes, [0x4d, 0x4d, 0x00, 0x2a])) {
    return startsWith(bytes, 'CR', 8) ? FORMATS.cr2 : FORMATS.tiff
  }
  if (startsWith(bytes, 'BM')) return FORMATS.bmp
  if (startsWith(bytes, [0, 0, 1, 0]) || startsWith(bytes, [0, 0, 2, 0])) return FORMATS.ico
  const head = ascii(bytes, 0, 512).trimStart()
  if (/^(<\?xml[^>]*>\s*)?(<!--[\s\S]*?-->\s*)*(<!DOCTYPE svg[^>]*>\s*)?<svg[\s>]/i.test(head)) return FORMATS.svg
  return null
}

export function fileExtension(fileName: string) {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(dot + 1).toLowerCase() : ''
}

/** A friendlier name for TIFF-based camera RAW files, which share the TIFF signature. */
export function describeFormat(format: ImageFormat, fileName: string) {
  const rawName = format.id === 'tiff' ? RAW_NAMES[fileExtension(fileName)] : undefined
  return rawName ? `${rawName} (TIFF-based)` : format.name
}

/** Warning when the file extension disagrees with the real content (e.g. a PNG renamed to .jpg). */
export function formatMismatch(format: ImageFormat | null, fileName: string) {
  const extension = fileExtension(fileName)
  if (!format || !extension || format.extensions.includes(extension)) return null
  return `The file is named “.${extension}” but its content is actually ${format.name}.`
}
