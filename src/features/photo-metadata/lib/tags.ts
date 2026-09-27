import { load, type ExpandedTags } from 'exifreader'

/** Every metadata group ExifReader found, keyed by group (exif, gps, xmp, iptc, icc…). */
export type MetadataTags = ExpandedTags

/** A tag as ExifReader returns it: a raw value plus a human-readable description. */
export interface RawTag {
  value?: unknown
  description?: unknown
}

export type TagGroupName = 'exif' | 'xmp' | 'iptc' | 'makerNotes' | 'pngText' | 'png' | 'icc' | 'file' | 'jfif' | 'riff' | 'gif' | 'pngFile'

/** Groups searched, in order, when a tag may live in several places. */
const DEFAULT_GROUPS: TagGroupName[] = ['exif', 'xmp', 'iptc', 'makerNotes']

/** Parses every metadata block of an image. Files with no metadata return an empty object. */
export async function readTags(buffer: ArrayBuffer): Promise<MetadataTags> {
  const options = { expanded: true, includeUnknown: true } as const
  try {
    // Async mode also decompresses zipped blocks (PNG zTXt/iTXt, compressed ICC profiles).
    return await load(buffer, { ...options, async: true })
  } catch (error) {
    if (isMetadataMissing(error)) return {}
    // A damaged compressed block should not hide everything else: retry without decompression.
    try {
      return load(buffer, options)
    } catch (retryError) {
      if (isMetadataMissing(retryError)) return {}
      throw retryError
    }
  }
}

function isMetadataMissing(error: unknown) {
  return error instanceof Error && error.name === 'MetadataMissingError'
}

function group(tags: MetadataTags, name: TagGroupName): Record<string, unknown> | undefined {
  return (tags as Record<string, Record<string, unknown> | undefined>)[name]
}

export function getTag(tags: MetadataTags, name: string, groups: TagGroupName[] = DEFAULT_GROUPS): RawTag | undefined {
  for (const groupName of groups) {
    const tag = group(tags, groupName)?.[name]
    if (tag && typeof tag === 'object') return tag as RawTag
  }
  return undefined
}

function cleanText(text: string) {
  // Camera firmware often pads strings with NULs or spaces.
  // eslint-disable-next-line no-control-regex
  return text.replace(/\u0000+/g, ' ').trim()
}

/** First non-empty description among `names`, looked up in `groups`. */
export function tagText(tags: MetadataTags, names: string | string[], groups?: TagGroupName[]): string | undefined {
  for (const name of Array.isArray(names) ? names : [names]) {
    const description = getTag(tags, name, groups)?.description
    const text = typeof description === 'string' || typeof description === 'number' ? cleanText(String(description)) : ''
    if (text && text !== 'undefined' && text !== 'Unknown') return text
  }
  return undefined
}

/** Numeric value of a tag, resolving EXIF rationals (`[numerator, denominator]`). */
export function tagNumber(tags: MetadataTags, names: string | string[], groups?: TagGroupName[]): number | undefined {
  for (const name of Array.isArray(names) ? names : [names]) {
    const number = toNumber(getTag(tags, name, groups)?.value)
    if (number !== undefined) return number
  }
  return undefined
}

export function toNumber(value: unknown): number | undefined {
  if (typeof value === 'number') return Number.isFinite(value) ? value : undefined
  if (typeof value === 'string' && value.trim() !== '') {
    // XMP stores rationals as text, e.g. "28/10".
    const [numerator, denominator] = value.split('/').map(Number)
    const number = denominator === undefined ? numerator : numerator / denominator
    return Number.isFinite(number) ? number : undefined
  }
  if (Array.isArray(value)) {
    if (value.length === 2 && typeof value[0] === 'number' && typeof value[1] === 'number') {
      return value[1] === 0 ? undefined : value[0] / value[1]
    }
    return toNumber(value[0])
  }
  return undefined
}
