export type ColorMode = 'elevation' | 'grade'

export interface GradeBand {
  /** Lower bound in percent (inclusive). */
  min: number
  color: string
  label: string
}

/** Grade bands from steep descent (blue) to very steep climb (dark red), ordered by `min`. */
export const GRADE_BANDS: readonly GradeBand[] = [
  { min: -Infinity, color: '#1e40af', label: '< −10 %' },
  { min: -10, color: '#3b82f6', label: '−10 to −4 %' },
  { min: -4, color: '#22c55e', label: '−4 to 4 %' },
  { min: 4, color: '#eab308', label: '4 to 8 %' },
  { min: 8, color: '#f97316', label: '8 to 12 %' },
  { min: 12, color: '#dc2626', label: '12 to 20 %' },
  { min: 20, color: '#7f1d1d', label: '> 20 %' },
]

export function gradeColor(grade: number): string {
  let color = GRADE_BANDS[0].color
  for (const band of GRADE_BANDS) {
    if (grade >= band.min) color = band.color
  }
  return color
}

/** Low to high elevation: green valleys, yellow and orange slopes, dark red-brown summits. */
export const ELEVATION_STOPS: readonly string[] = ['#15803d', '#65a30d', '#eab308', '#ea580c', '#991b1b']

function hexToRgb(hex: string): [number, number, number] {
  const value = parseInt(hex.slice(1), 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}

function rgbToHex([r, g, b]: [number, number, number]): string {
  return `#${[r, g, b].map((channel) => Math.round(channel).toString(16).padStart(2, '0')).join('')}`
}

/** Color for `ele` on a gradient spanning `minEle`…`maxEle`. */
export function elevationColor(ele: number, minEle: number, maxEle: number): string {
  const fraction = maxEle > minEle ? Math.min(1, Math.max(0, (ele - minEle) / (maxEle - minEle))) : 0
  const position = fraction * (ELEVATION_STOPS.length - 1)
  const lower = Math.floor(position)
  const upper = Math.min(lower + 1, ELEVATION_STOPS.length - 1)
  const from = hexToRgb(ELEVATION_STOPS[lower])
  const to = hexToRgb(ELEVATION_STOPS[upper])
  const local = position - lower
  return rgbToHex([0, 1, 2].map((channel) => from[channel] + (to[channel] - from[channel]) * local) as [number, number, number])
}

/** Color used when there is nothing to color by (no elevation data). */
export const DEFAULT_TRACK_COLOR = '#0284c7'

interface ColorablePoint {
  smoothEle: number | null
  grade: number
}

/** Returns a function that colors a point for the chosen mode. */
export function pointColorer(mode: ColorMode, minEle: number | null, maxEle: number | null) {
  return (point: ColorablePoint): string => {
    if (point.smoothEle === null || minEle === null || maxEle === null) return DEFAULT_TRACK_COLOR
    return mode === 'grade' ? gradeColor(point.grade) : elevationColor(point.smoothEle, minEle, maxEle)
  }
}
