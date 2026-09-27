export interface IcoEntry {
  /** Width and height in pixels, 1–256. */
  size: number
  /** A PNG-encoded image of `size`×`size` pixels. */
  png: Uint8Array
}

const HEADER_BYTES = 6
const ENTRY_BYTES = 16

/**
 * Packs PNG images into a multi-resolution .ico file. PNG entries are
 * supported by Windows Vista and later and by every current browser.
 */
export function encodeIco(entries: readonly IcoEntry[]): Uint8Array<ArrayBuffer> {
  if (entries.length === 0) throw new Error('An .ico file needs at least one image')
  const sorted = [...entries].sort((a, b) => a.size - b.size)
  for (const { size } of sorted) {
    if (!Number.isInteger(size) || size < 1 || size > 256) throw new Error(`Invalid .ico image size: ${size}`)
  }

  const dataOffset = HEADER_BYTES + ENTRY_BYTES * sorted.length
  const totalBytes = sorted.reduce((total, entry) => total + entry.png.length, dataOffset)
  const bytes = new Uint8Array(totalBytes)
  const view = new DataView(bytes.buffer)

  view.setUint16(0, 0, true) // reserved
  view.setUint16(2, 1, true) // type: icon
  view.setUint16(4, sorted.length, true)

  let offset = dataOffset
  sorted.forEach(({ size, png }, index) => {
    const entry = HEADER_BYTES + ENTRY_BYTES * index
    // 0 means 256 in the one-byte width and height fields.
    view.setUint8(entry, size === 256 ? 0 : size)
    view.setUint8(entry + 1, size === 256 ? 0 : size)
    view.setUint8(entry + 2, 0) // palette colors
    view.setUint8(entry + 3, 0) // reserved
    view.setUint16(entry + 4, 1, true) // color planes
    view.setUint16(entry + 6, 32, true) // bits per pixel
    view.setUint32(entry + 8, png.length, true)
    view.setUint32(entry + 12, offset, true)
    bytes.set(png, offset)
    offset += png.length
  })

  return bytes
}
