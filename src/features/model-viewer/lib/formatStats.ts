/** Formats a count with thousands separators, e.g. 12,345. */
export function formatCount(value: number) {
  return value.toLocaleString('en')
}

/** Formats a count followed by a noun, e.g. "1 vertex" or "12 vertices". */
export function formatQuantity(value: number, singular: string, plural = `${singular}s`) {
  return `${formatCount(value)} ${value === 1 ? singular : plural}`
}

/** Formats a model-space length with at most 3 significant digits, e.g. 0.0123 or 1,250. */
export function formatLength(value: number) {
  if (value === 0) return '0'
  const digits = Math.max(0, 2 - Math.floor(Math.log10(Math.abs(value))))
  return Number(value.toFixed(Math.min(digits, 6))).toLocaleString('en', { maximumFractionDigits: 6 })
}

/** Formats bounding-box dimensions as "W × H × D". */
export function formatSize(size: { x: number; y: number; z: number }) {
  return [size.x, size.y, size.z].map(formatLength).join(' × ')
}
