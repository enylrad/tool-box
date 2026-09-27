/** Small helpers for reading and writing binary file structures. */

export function ascii(bytes: Uint8Array, start: number, length: number) {
  let text = ''
  for (let i = start; i < start + length && i < bytes.length; i++) text += String.fromCharCode(bytes[i])
  return text
}

export function startsWith(bytes: Uint8Array, signature: ArrayLike<number> | string, offset = 0) {
  const expected = typeof signature === 'string' ? Array.from(signature, (char) => char.charCodeAt(0)) : signature
  if (bytes.length < offset + expected.length) return false
  for (let i = 0; i < expected.length; i++) {
    if (bytes[offset + i] !== expected[i]) return false
  }
  return true
}

/** Index of the first occurrence of an ASCII string, or -1. */
export function indexOfAscii(bytes: Uint8Array, text: string, from = 0) {
  const first = text.charCodeAt(0)
  for (let i = bytes.indexOf(first, from); i !== -1; i = bytes.indexOf(first, i + 1)) {
    if (startsWith(bytes, text, i)) return i
  }
  return -1
}

export function readUint16BE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] << 8) | bytes[offset + 1]
}

export function readUint32BE(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0
}

export function readUint32LE(bytes: Uint8Array, offset: number) {
  return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0
}

export function writeUint32BE(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = (value >>> 24) & 0xff
  bytes[offset + 1] = (value >>> 16) & 0xff
  bytes[offset + 2] = (value >>> 8) & 0xff
  bytes[offset + 3] = value & 0xff
}

export function writeUint32LE(bytes: Uint8Array, offset: number, value: number) {
  bytes[offset] = value & 0xff
  bytes[offset + 1] = (value >>> 8) & 0xff
  bytes[offset + 2] = (value >>> 16) & 0xff
  bytes[offset + 3] = (value >>> 24) & 0xff
}

export function concatBytes(parts: Uint8Array[]) {
  const total = parts.reduce((sum, part) => sum + part.length, 0)
  const result = new Uint8Array(total)
  let offset = 0
  for (const part of parts) {
    result.set(part, offset)
    offset += part.length
  }
  return result
}

export function asciiBytes(text: string) {
  return Uint8Array.from(text, (char) => char.charCodeAt(0))
}

let crcTable: Uint32Array | null = null

/** CRC-32 as used by PNG chunks. */
export function crc32(bytes: Uint8Array) {
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
