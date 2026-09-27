const PLACEHOLDER = '—'
const integerFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

/** "850 m", "4.25 km", "123.4 km". */
export function formatDistance(meters: number): string {
  if (meters < 1000) return `${integerFormat.format(meters)} m`
  const kilometers = meters / 1000
  return `${kilometers.toFixed(kilometers < 10 ? 2 : 1)} km`
}

/** "1,234 m". */
export function formatElevation(meters: number | null): string {
  return meters === null ? PLACEHOLDER : `${integerFormat.format(meters)} m`
}

/** "+8.5 %" / "−3.0 %". */
export function formatGrade(percent: number | null): string {
  if (percent === null) return PLACEHOLDER
  const rounded = Math.round(percent * 10) / 10
  const sign = rounded > 0 ? '+' : rounded < 0 ? '−' : ''
  return `${sign}${Math.abs(rounded).toFixed(1)} %`
}

/** "0:42:05", "12:03:59". */
export function formatDuration(milliseconds: number | null): string {
  if (milliseconds === null) return PLACEHOLDER
  const totalSeconds = Math.round(milliseconds / 1000)
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

/** Meters per second as "12.3 km/h". */
export function formatSpeed(metersPerSecond: number | null): string {
  return metersPerSecond === null ? PLACEHOLDER : `${(metersPerSecond * 3.6).toFixed(1)} km/h`
}

/** Meters per second as a running/hiking pace, "5:24 /km". */
export function formatPace(metersPerSecond: number | null): string {
  if (metersPerSecond === null || metersPerSecond <= 0) return PLACEHOLDER
  const secondsPerKm = Math.round(1000 / metersPerSecond)
  if (secondsPerKm >= 100 * 60) return PLACEHOLDER
  return `${Math.floor(secondsPerKm / 60)}:${String(secondsPerKm % 60).padStart(2, '0')} /km`
}
