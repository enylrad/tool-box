import { asciiBytes, crc32, writeUint32BE } from './bytes'

/** Encodes one PNG chunk: length, type, data and CRC. */
export function pngChunkBytes(type: string, data: Uint8Array) {
  const chunk = new Uint8Array(12 + data.length)
  writeUint32BE(chunk, 0, data.length)
  chunk.set(asciiBytes(type), 4)
  chunk.set(data, 8)
  writeUint32BE(chunk, 8 + data.length, crc32(chunk.subarray(4, 8 + data.length)))
  return chunk
}
