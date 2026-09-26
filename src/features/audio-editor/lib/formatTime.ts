/** Formats seconds as `m:ss.mmm` (or `h:mm:ss.mmm` for an hour or more). */
export function formatTime(seconds: number): string {
  const safe = Number.isFinite(seconds) && seconds > 0 ? seconds : 0
  const totalMs = Math.round(safe * 1000)
  const ms = totalMs % 1000
  const totalSeconds = Math.floor(totalMs / 1000)
  const s = totalSeconds % 60
  const totalMinutes = Math.floor(totalSeconds / 60)
  const m = totalMinutes % 60
  const h = Math.floor(totalMinutes / 60)
  const tail = `${String(s).padStart(2, '0')}.${String(ms).padStart(3, '0')}`
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${tail}` : `${m}:${tail}`
}

/**
 * Parses `1:23.5`, `1:02:03`, `83.5` or `83,5` into seconds.
 * Returns `null` when the text is not a valid, non-negative time.
 */
export function parseTime(text: string): number | null {
  const parts = text.trim().replace(',', '.').split(':')
  if (parts.length > 3 || parts.some((part) => !/^\d+(\.\d*)?$|^\.\d+$/.test(part))) return null
  // Only the last part (seconds) may have decimals.
  if (parts.slice(0, -1).some((part) => part.includes('.'))) return null
  return parts.reduce((total, part) => total * 60 + Number(part), 0)
}

/** Human-readable file size, e.g. `3.4 MB`. */
export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  const units = ['KB', 'MB', 'GB']
  let value = bytes / 1024
  let unit = 0
  while (value >= 1024 && unit < units.length - 1) {
    value /= 1024
    unit++
  }
  return `${value.toFixed(value < 10 ? 1 : 0)} ${units[unit]}`
}
