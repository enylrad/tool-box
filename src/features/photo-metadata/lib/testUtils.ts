import { asciiBytes, concatBytes, writeUint32BE, writeUint32LE } from './bytes'
import { pngChunkBytes } from './pngChunk'

/** Builders for tiny, hand-made image files used by the unit tests. */

type ExifValue =
  | { type: 'ascii'; value: string }
  | { type: 'byte'; value: number[] }
  | { type: 'short'; value: number[] }
  | { type: 'long'; value: number[] }
  | { type: 'rational'; value: [number, number][] }
  | { type: 'srational'; value: [number, number][] }
  | { type: 'undefined'; value: number[] }

export type ExifEntry = { tag: number } & ExifValue

export interface ExifSpec {
  ifd0?: ExifEntry[]
  exif?: ExifEntry[]
  gps?: ExifEntry[]
}

const TYPE_CODES = { byte: 1, ascii: 2, short: 3, long: 4, rational: 5, undefined: 7, srational: 10 }
const TYPE_SIZES = { byte: 1, ascii: 1, short: 2, long: 4, rational: 8, undefined: 1, srational: 8 }

function valueCount(entry: ExifEntry) {
  return entry.type === 'ascii' ? entry.value.length + 1 : entry.value.length
}

function encodeValue(entry: ExifEntry) {
  const bytes = new Uint8Array(valueCount(entry) * TYPE_SIZES[entry.type])
  const view = new DataView(bytes.buffer)
  switch (entry.type) {
    case 'ascii':
      bytes.set(asciiBytes(entry.value))
      break
    case 'byte':
    case 'undefined':
      bytes.set(entry.value)
      break
    case 'short':
      entry.value.forEach((value, index) => view.setUint16(index * 2, value))
      break
    case 'long':
      entry.value.forEach((value, index) => view.setUint32(index * 4, value))
      break
    case 'rational':
    case 'srational':
      entry.value.forEach(([numerator, denominator], index) => {
        view.setInt32(index * 8, numerator)
        view.setInt32(index * 8 + 4, denominator)
      })
      break
  }
  return bytes
}

/** A big-endian TIFF structure (the payload of an EXIF block). */
export function buildTiff(spec: ExifSpec) {
  const ifds: ExifEntry[][] = [[...(spec.ifd0 ?? [])]]
  const exifIndex = spec.exif?.length ? ifds.push(spec.exif) - 1 : -1
  const gpsIndex = spec.gps?.length ? ifds.push(spec.gps) - 1 : -1
  if (exifIndex > 0) ifds[0].push({ tag: 0x8769, type: 'long', value: [0] })
  if (gpsIndex > 0) ifds[0].push({ tag: 0x8825, type: 'long', value: [0] })
  ifds.forEach((entries) => entries.sort((a, b) => a.tag - b.tag))

  // First pass: where each IFD and its out-of-line data will live.
  const offsets: number[] = []
  let cursor = 8
  for (const entries of ifds) {
    offsets.push(cursor)
    cursor += 2 + entries.length * 12 + 4
    for (const entry of entries) {
      const size = encodeValue(entry).length
      if (size > 4) cursor += size + (size % 2)
    }
  }
  if (exifIndex > 0) ifds[0].find((entry) => entry.tag === 0x8769)!.value = [offsets[exifIndex]]
  if (gpsIndex > 0) ifds[0].find((entry) => entry.tag === 0x8825)!.value = [offsets[gpsIndex]]

  const tiff = new Uint8Array(cursor)
  const view = new DataView(tiff.buffer)
  tiff.set([0x4d, 0x4d, 0x00, 0x2a, 0, 0, 0, 8])
  ifds.forEach((entries, index) => {
    let position = offsets[index]
    let dataOffset = position + 2 + entries.length * 12 + 4
    view.setUint16(position, entries.length)
    position += 2
    for (const entry of entries) {
      const encoded = encodeValue(entry)
      view.setUint16(position, entry.tag)
      view.setUint16(position + 2, TYPE_CODES[entry.type])
      view.setUint32(position + 4, valueCount(entry))
      if (encoded.length <= 4) {
        tiff.set(encoded, position + 8)
      } else {
        view.setUint32(position + 8, dataOffset)
        tiff.set(encoded, dataOffset)
        dataOffset += encoded.length + (encoded.length % 2)
      }
      position += 12
    }
  })
  return tiff
}

function jpegSegment(marker: number, payload: Uint8Array) {
  const length = payload.length + 2
  return concatBytes([new Uint8Array([0xff, marker, length >> 8, length & 0xff]), payload])
}

export interface JpegSpec {
  exif?: ExifSpec
  xmp?: string
  icc?: boolean
  comment?: string
  /** Bytes appended after the end-of-image marker (e.g. a motion-photo video). */
  trailer?: Uint8Array
}

/** A structurally valid JPEG. The scan data is fake, so it only needs to be parsed, not displayed. */
export function buildJpeg(spec: JpegSpec = {}) {
  const parts: Uint8Array[] = [new Uint8Array([0xff, 0xd8])]
  parts.push(jpegSegment(0xe0, concatBytes([asciiBytes('JFIF\0'), new Uint8Array([1, 1, 0, 0, 1, 0, 1, 0, 0])])))
  if (spec.exif) parts.push(jpegSegment(0xe1, concatBytes([asciiBytes('Exif\0\0'), buildTiff(spec.exif)])))
  if (spec.xmp) parts.push(jpegSegment(0xe1, concatBytes([asciiBytes('http://ns.adobe.com/xap/1.0/\0'), asciiBytes(spec.xmp)])))
  if (spec.icc) parts.push(jpegSegment(0xe2, concatBytes([asciiBytes('ICC_PROFILE\0'), new Uint8Array([1, 1, 0, 0])])))
  if (spec.comment) parts.push(jpegSegment(0xfe, asciiBytes(spec.comment)))
  parts.push(jpegSegment(0xdb, new Uint8Array(65)))
  parts.push(jpegSegment(0xc0, new Uint8Array([8, 0, 2, 0, 3, 1, 1, 0x11, 0])))
  parts.push(jpegSegment(0xda, new Uint8Array([1, 1, 0, 0, 0x3f, 0])))
  // Entropy-coded data with a stuffed 0xFF00 byte and a restart marker.
  parts.push(new Uint8Array([0x12, 0xff, 0x00, 0x34, 0xff, 0xd0, 0x56, 0xff, 0xd9]))
  if (spec.trailer) parts.push(spec.trailer)
  return concatBytes(parts)
}

export const pngChunk = pngChunkBytes

export function buildPng(extraChunks: Uint8Array[] = []) {
  const header = new Uint8Array(13)
  writeUint32BE(header, 0, 1)
  writeUint32BE(header, 4, 1)
  header.set([8, 6, 0, 0, 0], 8)
  return concatBytes([
    new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    pngChunk('IHDR', header),
    ...extraChunks,
    pngChunk('IDAT', new Uint8Array([0x78, 0x9c, 0x62, 0, 0, 0, 0xff, 0xff])),
    pngChunk('IEND', new Uint8Array()),
  ])
}

export function webpChunk(type: string, data: Uint8Array) {
  const chunk = new Uint8Array(8 + data.length + (data.length % 2))
  chunk.set(asciiBytes(type))
  writeUint32LE(chunk, 4, data.length)
  chunk.set(data, 8)
  return chunk
}

/** An extended (VP8X) WebP with the given flags and extra chunks. */
export function buildWebp(flags: number, chunks: Uint8Array[]) {
  const vp8x = new Uint8Array(10)
  vp8x[0] = flags
  const body = concatBytes([asciiBytes('WEBP'), webpChunk('VP8X', vp8x), webpChunk('VP8L', new Uint8Array(5)), ...chunks])
  const header = new Uint8Array(8)
  header.set(asciiBytes('RIFF'))
  writeUint32LE(header, 4, body.length)
  return concatBytes([header, body])
}

/** Exposes a Uint8Array as a standalone ArrayBuffer, as FileReader would produce. */
export function toArrayBuffer(bytes: Uint8Array) {
  return bytes.slice().buffer
}

export const SAMPLE_XMP = `<x:xmpmeta xmlns:x="adobe:ns:meta/"><rdf:RDF xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"><rdf:Description rdf:about="" xmlns:xmp="http://ns.adobe.com/xap/1.0/" xmlns:Iptc4xmpExt="http://iptc.org/std/Iptc4xmpExt/2008-02-29/" xmlns:xmpMM="http://ns.adobe.com/xap/1.0/mm/" xmlns:stEvt="http://ns.adobe.com/xap/1.0/sType/ResourceEvent#" xmp:CreatorTool="Adobe Photoshop 25.0" Iptc4xmpExt:DigitalSourceType="http://cv.iptc.org/newscodes/digitalsourcetype/compositeWithTrainedAlgorithmicMedia"><xmpMM:History><rdf:Seq><rdf:li stEvt:action="saved" stEvt:when="2025-08-01T10:00:00+02:00" stEvt:softwareAgent="Adobe Photoshop 25.0" stEvt:changed="/"/></rdf:Seq></xmpMM:History></rdf:Description></rdf:RDF></x:xmpmeta>`

/** EXIF of a phone photo taken in Madrid, with GPS and a serial number. */
export const SAMPLE_EXIF: ExifSpec = {
  ifd0: [
    { tag: 0x010f, type: 'ascii', value: 'Google' },
    { tag: 0x0110, type: 'ascii', value: 'Pixel 10 Pro' },
    { tag: 0x0112, type: 'short', value: [6] },
    { tag: 0x0131, type: 'ascii', value: 'HDR+ 1.0' },
    { tag: 0x0132, type: 'ascii', value: '2025:08:01 10:00:00' },
  ],
  exif: [
    { tag: 0x829a, type: 'rational', value: [[1, 250]] },
    { tag: 0x829d, type: 'rational', value: [[185, 100]] },
    { tag: 0x8827, type: 'short', value: [100] },
    { tag: 0x9003, type: 'ascii', value: '2025:07:31 18:32:10' },
    { tag: 0x9011, type: 'ascii', value: '+02:00' },
    { tag: 0x9204, type: 'srational', value: [[-2, 3]] },
    { tag: 0x9209, type: 'short', value: [16] },
    { tag: 0x920a, type: 'rational', value: [[690, 100]] },
    { tag: 0xa002, type: 'long', value: [4080] },
    { tag: 0xa003, type: 'long', value: [3072] },
    { tag: 0xa405, type: 'short', value: [24] },
    { tag: 0xa431, type: 'ascii', value: 'ABC123' },
    { tag: 0xa434, type: 'ascii', value: 'Pixel 10 Pro back camera 6.9mm f/1.85' },
  ],
  gps: [
    { tag: 1, type: 'ascii', value: 'N' },
    { tag: 2, type: 'rational', value: [[40, 1], [25, 1], [123, 10]] },
    { tag: 3, type: 'ascii', value: 'W' },
    { tag: 4, type: 'rational', value: [[3, 1], [42, 1], [30, 1]] },
    { tag: 5, type: 'byte', value: [0] },
    { tag: 6, type: 'rational', value: [[6575, 10]] },
  ],
}
