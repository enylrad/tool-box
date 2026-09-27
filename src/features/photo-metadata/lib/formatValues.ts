/** Exposure time as photographers write it: `1/250 s`, `0.5 s`, `30 s`. */
export function formatShutterSpeed(seconds: number) {
  if (seconds <= 0) return undefined
  if (seconds < 0.3) return `1/${Math.round(1 / seconds)} s`
  return `${Number(seconds.toFixed(1))} s`
}

export function formatAperture(fNumber: number) {
  return `f/${Number(fNumber.toFixed(1))}`
}

export function formatFocalLength(millimetres: number) {
  return `${Number(millimetres.toFixed(1))} mm`
}

export function formatExposureBias(ev: number) {
  const rounded = Number(ev.toFixed(1))
  return `${rounded > 0 ? '+' : ''}${rounded} EV`
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b)
}

const COMMON_RATIOS = [
  [1, 1],
  [4, 3],
  [3, 2],
  [16, 9],
  [5, 4],
  [16, 10],
  [21, 9],
  [2, 1],
  [65, 24],
]

/** Aspect ratio such as `4:3` or `3:4` (portrait); falls back to `1.78:1` for unusual sizes. */
export function formatAspectRatio(width: number, height: number) {
  if (width <= 0 || height <= 0) return undefined
  const divisor = gcd(width, height)
  if (width / divisor <= 32 && height / divisor <= 32) return `${width / divisor}:${height / divisor}`
  const ratio = Math.max(width, height) / Math.min(width, height)
  const match = COMMON_RATIOS.find(([long, short]) => Math.abs(long / short - ratio) < 0.01)
  if (match) return width >= height ? `${match[0]}:${match[1]}` : `${match[1]}:${match[0]}`
  return width >= height ? `${ratio.toFixed(2)}:1` : `1:${ratio.toFixed(2)}`
}

export function formatMegapixels(width: number, height: number) {
  return `${((width * height) / 1_000_000).toFixed(1)} MP`
}

/**
 * EXIF dates look like `2024:05:17 18:32:10` and have no time zone; the zone
 * (`+02:00`) and sub-seconds are stored in separate tags.
 */
export function formatExifDate(date: string, offset?: string, subSeconds?: string) {
  const match = /^(\d{4})[:-](\d{2})[:-](\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?/.exec(date.trim())
  if (!match) return date
  const [, year, month, day, hour, minute, second = '00'] = match
  const fraction = subSeconds && /^\d+$/.test(subSeconds.trim()) ? `.${subSeconds.trim()}` : ''
  let result = `${year}-${month}-${day} ${hour}:${minute}:${second}${fraction}`
  const zone = offset?.trim() || /([+-]\d{2}:\d{2}|Z)$/.exec(date.trim())?.[1]
  if (zone) result += zone === 'Z' ? ' (UTC)' : ` (UTC${zone})`
  return result
}

/** `2024-05-17 18:32:10` in the viewer's local time zone. */
export function formatLocalDate(timestamp: number) {
  const date = new Date(timestamp)
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`
}
