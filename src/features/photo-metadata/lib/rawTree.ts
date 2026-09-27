import type { MetadataTags } from './tags'

export interface TreeNode {
  key: string
  /** Human-readable value. Absent for branches. */
  value?: string
  /** Raw stored value, when it differs from the readable one (e.g. `[1, 250]` for `1/250`). */
  raw?: string
  children?: TreeNode[]
}

const GROUP_LABELS: Record<string, string> = {
  file: 'File header',
  jfif: 'JFIF',
  pngFile: 'PNG header',
  png: 'PNG',
  pngText: 'PNG text chunks',
  riff: 'WebP (RIFF)',
  gif: 'GIF',
  exif: 'EXIF',
  gps: 'GPS (calculated)',
  xmp: 'XMP',
  iptc: 'IPTC',
  icc: 'ICC color profile',
  photoshop: 'Photoshop',
  makerNotes: 'Maker notes',
  composite: 'Composite (calculated)',
  Thumbnail: 'Embedded thumbnail',
}

const SKIPPED_GROUPS = new Set(['metadataRange'])
const SKIPPED_KEYS = new Set(['_raw', 'base64'])
const MAX_ARRAY_PREVIEW = 16
const MAX_TEXT_LENGTH = 4000

export function groupLabel(group: string) {
  return GROUP_LABELS[group] ?? group
}

function isBinary(value: unknown): value is ArrayBuffer | ArrayBufferView {
  return value instanceof ArrayBuffer || ArrayBuffer.isView(value) || Object.prototype.toString.call(value) === '[object ArrayBuffer]'
}

function binaryLength(value: ArrayBuffer | ArrayBufferView) {
  return value.byteLength
}

function isPrimitive(value: unknown): value is string | number | boolean {
  return typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean'
}

function truncate(text: string) {
  return text.length > MAX_TEXT_LENGTH ? `${text.slice(0, MAX_TEXT_LENGTH)}… (${text.length.toLocaleString('en-US')} characters)` : text
}

/** Compact text for raw values: numbers, strings, rationals and (long) arrays. */
export function formatRawValue(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (isBinary(value)) return `<binary data, ${binaryLength(value).toLocaleString('en-US')} bytes>`
  if (isPrimitive(value)) return truncate(String(value))
  if (Array.isArray(value)) {
    if (value.length === 1) return formatRawValue(value[0])
    if (value.length === 2 && value.every((part) => typeof part === 'number')) return `${value[0]}/${value[1]}`
    const shown = value.slice(0, MAX_ARRAY_PREVIEW).map(formatRawValue).join(', ')
    return value.length > MAX_ARRAY_PREVIEW ? `[${shown}, … ${value.length} values]` : `[${shown}]`
  }
  return truncate(JSON.stringify(value))
}

function isTagLike(value: unknown): value is { value?: unknown; description?: unknown; attributes?: Record<string, string> } {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value) && ('value' in (value as object) || 'description' in (value as object))
}

function nodeFor(key: string, entry: unknown): TreeNode {
  if (isBinary(entry) || isPrimitive(entry) || entry === null || entry === undefined) {
    return { key, value: formatRawValue(entry) }
  }
  if (Array.isArray(entry)) {
    return { key, children: entry.map((item, index) => nodeFor(`[${index + 1}]`, item)) }
  }
  if (isTagLike(entry)) {
    const { value, description, attributes } = entry
    // XMP structures and arrays nest further tags inside `value`.
    if (Array.isArray(value) && value.some((item) => item && typeof item === 'object' && !Array.isArray(item))) {
      return { key, children: value.map((item, index) => nodeFor(`[${index + 1}]`, item)) }
    }
    if (value && typeof value === 'object' && !Array.isArray(value) && !isBinary(value)) {
      return { key, children: childrenOf(value as Record<string, unknown>) }
    }
    const readable = description !== undefined && description !== '' ? formatRawValue(description) : formatRawValue(value)
    const raw = formatRawValue(value)
    const node: TreeNode = { key, value: readable }
    if (raw && raw !== readable) node.raw = raw
    if (attributes && Object.keys(attributes).length > 0) {
      node.children = Object.entries(attributes).map(([name, text]) => ({ key: `@${name}`, value: truncate(text) }))
    }
    return node
  }
  return { key, children: childrenOf(entry as Record<string, unknown>) }
}

function childrenOf(record: Record<string, unknown>) {
  return Object.entries(record)
    .filter(([key]) => !SKIPPED_KEYS.has(key))
    .map(([key, entry]) => nodeFor(key, entry))
}

/** Every metadata group as a browsable tree. */
export function buildMetadataTree(tags: MetadataTags): TreeNode[] {
  return Object.entries(tags as Record<string, unknown>)
    .filter(([group, entries]) => !SKIPPED_GROUPS.has(group) && entries && typeof entries === 'object')
    .map(([group, entries]) => ({ key: groupLabel(group), children: childrenOf(entries as Record<string, unknown>) }))
    .filter((node) => node.children.length > 0)
}

export function countLeaves(nodes: TreeNode[]): number {
  return nodes.reduce((total, node) => total + (node.children ? countLeaves(node.children) : 1), 0)
}

/** Keeps the nodes whose key or value contains `query` (and the branches leading to them). */
export function filterTree(nodes: TreeNode[], query: string): TreeNode[] {
  const needle = query.trim().toLowerCase()
  if (!needle) return nodes
  const result: TreeNode[] = []
  for (const node of nodes) {
    const matchesSelf = node.key.toLowerCase().includes(needle) || Boolean(node.value?.toLowerCase().includes(needle))
    if (matchesSelf) {
      result.push(node)
    } else if (node.children) {
      const children = filterTree(node.children, needle)
      if (children.length > 0) result.push({ ...node, children })
    }
  }
  return result
}

type JsonValue = string | { [key: string]: JsonValue }

/** A plain JSON object of the tree, for copying or downloading. */
export function treeToJson(nodes: TreeNode[]): Record<string, JsonValue> {
  const result: Record<string, JsonValue> = {}
  for (const node of nodes) {
    let key = node.key
    for (let suffix = 2; key in result; suffix++) key = `${node.key} (${suffix})`
    result[key] = node.children ? treeToJson(node.value !== undefined ? [{ key: 'value', value: node.value }, ...node.children] : node.children) : (node.value ?? '')
  }
  return result
}
