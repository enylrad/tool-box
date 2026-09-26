export interface TrimRange {
  start: number
  /** `null` means "until the end of the video". */
  end: number | null
}

/** Formats seconds as `m:ss.s`, or `h:mm:ss.s` for an hour or more. */
export function formatTimecode(totalSeconds: number): string {
  const safeSeconds = Number.isFinite(totalSeconds) ? Math.max(0, totalSeconds) : 0
  // Work in tenths so that rounding 59.96 gives 1:00.0 instead of 0:60.0.
  const tenths = Math.round(safeSeconds * 10)
  const hours = Math.floor(tenths / 36000)
  const minutes = Math.floor((tenths % 36000) / 600)
  const seconds = (tenths % 600) / 10
  const secondsText = seconds.toFixed(1).padStart(4, '0')
  return hours > 0 ? `${hours}:${String(minutes).padStart(2, '0')}:${secondsText}` : `${minutes}:${secondsText}`
}

/**
 * Parses `ss`, `m:ss`, or `h:mm:ss`, each with optional decimals (`.` or `,`).
 * Returns `null` for anything else.
 */
export function parseTimecode(text: string): number | null {
  const parts = text.trim().replace(',', '.').split(':')
  if (parts.length > 3 || parts.some((part) => !/^\d+(\.\d+)?$/.test(part))) return null
  const numbers = parts.map(Number)
  // Only the last part may have decimals, and minutes/seconds after a colon stay below 60.
  if (numbers.slice(0, -1).some((value) => !Number.isInteger(value))) return null
  if (numbers.slice(1).some((value) => value >= 60)) return null
  return numbers.reduce((total, value) => total * 60 + value, 0)
}

/** Keeps the range inside the video and at least `minLength` long. */
export function clampTrim(range: TrimRange, duration: number, minLength = 0.1): TrimRange {
  if (!Number.isFinite(duration) || duration <= 0) return { start: Math.max(0, range.start), end: range.end }
  const end = range.end === null ? duration : Math.min(Math.max(range.end, minLength), duration)
  const start = Math.min(Math.max(range.start, 0), Math.max(0, end - minLength))
  return { start, end: end >= duration ? null : end }
}

/** Length of the trimmed clip, or `null` when the video duration is unknown. */
export function trimmedDuration(range: TrimRange, duration: number | null): number | null {
  const end = range.end ?? duration
  return end === null ? null : Math.max(0, end - range.start)
}

/** Whether the range removes anything from a video of the given duration. */
export function isTrimmed(range: TrimRange, duration: number | null): boolean {
  return range.start > 0 || (range.end !== null && (duration === null || range.end < duration))
}
