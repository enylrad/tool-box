import { haversineDistance, localProjection } from './geo'
import type { GpxTrack } from './parseGpx'

/** A track point with everything the views need, flattened across segments. */
export interface AnalyzedPoint {
  lat: number
  lon: number
  /** Meters east / north of the track center. */
  x: number
  y: number
  /** Elevation in meters (missing values are interpolated), or null when the file has no elevation at all. */
  ele: number | null
  /** Elevation smoothed over a short distance, used for grades and drawing. */
  smoothEle: number | null
  /** Distance from the start in meters. */
  distance: number
  /** Grade in percent around this point (positive = uphill). */
  grade: number
  time: number | null
  segment: number
}

export interface TrackStats {
  distance: number
  gain: number | null
  loss: number | null
  minEle: number | null
  maxEle: number | null
  startEle: number | null
  endEle: number | null
  /** Steepest sustained uphill and downhill grades, in percent. */
  maxGrade: number | null
  minGrade: number | null
  /** Milliseconds between the first and last timestamp. */
  duration: number | null
  /** Milliseconds spent moving faster than a slow walk. */
  movingTime: number | null
  /** Meters per second. */
  averageSpeed: number | null
  movingSpeed: number | null
  maxSpeed: number | null
  pointCount: number
  segmentCount: number
}

export interface TrackBounds {
  minX: number
  maxX: number
  minY: number
  maxY: number
}

export interface TrackAnalysis {
  name: string | null
  points: AnalyzedPoint[]
  stats: TrackStats
  bounds: TrackBounds
  hasElevation: boolean
  hasTime: boolean
}

/** Elevation changes smaller than this are treated as GPS/barometer noise when adding up gain and loss. */
export const ELEVATION_THRESHOLD_M = 3
/** Elevation is averaged over this distance (centered on each point) before computing grades. */
const SMOOTHING_WINDOW_M = 40
/** Grades are measured over this distance so a single noisy point does not create a 60 % wall. */
const GRADE_WINDOW_M = 100
const MIN_GRADE_RUN_M = 10
/** Below this speed (m/s, ~1.8 km/h) the time counts as stopped. */
const MOVING_SPEED_THRESHOLD = 0.5
/** Speeds are measured over this distance so GPS jitter does not create impossible peaks. */
const SPEED_WINDOW_M = 50

/** Fills missing elevations by linear interpolation over distance; returns null when there are none. */
function fillElevations(elevations: (number | null)[], distances: number[]): number[] | null {
  const known = elevations.flatMap((ele, index) => (ele === null ? [] : [index]))
  if (known.length === 0) return null
  const filled = new Array<number>(elevations.length)
  let next = 0
  for (let index = 0; index < elevations.length; index++) {
    while (next < known.length && known[next] < index) next++
    const ele = elevations[index]
    if (ele !== null) filled[index] = ele
    else if (next === 0) filled[index] = elevations[known[0]]!
    else if (next === known.length) filled[index] = elevations[known[known.length - 1]]!
    else {
      const before = known[next - 1]
      const after = known[next]
      const span = distances[after] - distances[before]
      const fraction = span === 0 ? 0 : (distances[index] - distances[before]) / span
      filled[index] = elevations[before]! + (elevations[after]! - elevations[before]!) * fraction
    }
  }
  return filled
}

function minMax(values: number[]): { min: number; max: number } {
  let min = Infinity
  let max = -Infinity
  for (const value of values) {
    if (value < min) min = value
    if (value > max) max = value
  }
  return { min, max }
}

/** Average of `values` over a window of `windowMeters` centered on each point (two pointers, O(n)). */
export function smoothOverDistance(values: number[], distances: number[], windowMeters: number): number[] {
  const half = windowMeters / 2
  const result = new Array<number>(values.length)
  let start = 0
  let end = 0
  let sum = 0
  for (let index = 0; index < values.length; index++) {
    while (end < values.length && distances[end] <= distances[index] + half) sum += values[end++]
    while (distances[start] < distances[index] - half) sum -= values[start++]
    result[index] = sum / (end - start)
  }
  return result
}

/**
 * Total ascent and descent, only counting a change once it exceeds `threshold`
 * meters from the last counted level (hysteresis), so noise does not add up.
 */
export function elevationGainLoss(elevations: number[], threshold = ELEVATION_THRESHOLD_M): { gain: number; loss: number } {
  let gain = 0
  let loss = 0
  let reference = elevations[0]
  for (const ele of elevations) {
    if (ele - reference >= threshold) {
      gain += ele - reference
      reference = ele
    } else if (reference - ele >= threshold) {
      loss += reference - ele
      reference = ele
    }
  }
  return { gain, loss }
}

/** Index of the first point at or beyond `distance`, clamped to the last point. */
export function indexAtDistance(points: readonly { distance: number }[], distance: number): number {
  let low = 0
  let high = points.length - 1
  while (low < high) {
    const middle = (low + high) >> 1
    if (points[middle].distance < distance) low = middle + 1
    else high = middle
  }
  return low
}

/** Index of the point closest to `distance`. */
export function nearestIndexAtDistance(points: readonly { distance: number }[], distance: number): number {
  const index = indexAtDistance(points, distance)
  if (index > 0 && distance - points[index - 1].distance < points[index].distance - distance) return index - 1
  return index
}

/** Grades over a centered window, each window kept within its own segment. */
function computeGrades(elevations: number[], distances: number[], segments: number[]): number[] {
  const half = GRADE_WINDOW_M / 2
  const grades = new Array<number>(elevations.length).fill(0)
  let start = 0
  let end = 0
  for (let index = 0; index < elevations.length; index++) {
    if (end < index) end = index
    while (end + 1 < elevations.length && segments[end + 1] === segments[index] && distances[end + 1] <= distances[index] + half) end++
    while (segments[start] !== segments[index] || distances[start] < distances[index] - half) start++
    const run = distances[end] - distances[start]
    // Very short runs (a couple of points close together) give meaningless grades.
    grades[index] = run >= MIN_GRADE_RUN_M ? ((elevations[end] - elevations[start]) / run) * 100 : 0
  }
  return grades
}

function segmentRanges(segments: number[]): [number, number][] {
  const ranges: [number, number][] = []
  let start = 0
  for (let index = 1; index <= segments.length; index++) {
    if (index === segments.length || segments[index] !== segments[start]) {
      ranges.push([start, index])
      start = index
    }
  }
  return ranges
}

function computeTimeStats(points: { distance: number; time: number | null }[], segments: number[]) {
  const timed = points.filter((point) => point.time !== null)
  if (timed.length < 2) return { duration: null, movingTime: null, averageSpeed: null, movingSpeed: null, maxSpeed: null }
  const duration = timed[timed.length - 1].time! - timed[0].time!
  let movingTime = 0
  let movingDistance = 0
  let maxSpeed = 0
  for (const [start, end] of segmentRanges(segments)) {
    const segment = points.slice(start, end).filter((point) => point.time !== null)
    let windowStart = 0
    for (let index = 1; index < segment.length; index++) {
      const point = segment[index]
      const previous = segment[index - 1]
      const seconds = (point.time! - previous.time!) / 1000
      const meters = point.distance - previous.distance
      if (seconds > 0 && meters / seconds >= MOVING_SPEED_THRESHOLD) {
        movingTime += seconds * 1000
        movingDistance += meters
      }
      // Max speed is measured over at least SPEED_WINDOW_M meters to smooth out GPS jitter.
      while (point.distance - segment[windowStart + 1].distance >= SPEED_WINDOW_M) windowStart++
      const windowMeters = point.distance - segment[windowStart].distance
      const windowSeconds = (point.time! - segment[windowStart].time!) / 1000
      if (windowMeters >= SPEED_WINDOW_M && windowSeconds > 0) maxSpeed = Math.max(maxSpeed, windowMeters / windowSeconds)
    }
  }
  const totalDistance = points[points.length - 1].distance
  return {
    duration,
    movingTime,
    averageSpeed: duration > 0 ? totalDistance / (duration / 1000) : null,
    movingSpeed: movingTime > 0 ? movingDistance / (movingTime / 1000) : null,
    maxSpeed: maxSpeed > 0 ? maxSpeed : null,
  }
}

/** Measures a parsed GPX track: distances, projected coordinates, elevation, grades and totals. */
export function analyzeTrack(track: GpxTrack): TrackAnalysis {
  const flat = track.segments.flatMap((segment, segmentIndex) => segment.map((point) => ({ ...point, segment: segmentIndex })))

  let minLat = Infinity
  let maxLat = -Infinity
  let minLon = Infinity
  let maxLon = -Infinity
  for (const { lat, lon } of flat) {
    minLat = Math.min(minLat, lat)
    maxLat = Math.max(maxLat, lat)
    minLon = Math.min(minLon, lon)
    maxLon = Math.max(maxLon, lon)
  }
  const projection = localProjection((minLat + maxLat) / 2, (minLon + maxLon) / 2)

  const distances: number[] = []
  flat.forEach((point, index) => {
    const previous = flat[index - 1]
    const step = previous && previous.segment === point.segment ? haversineDistance(previous.lat, previous.lon, point.lat, point.lon) : 0
    distances.push((distances[index - 1] ?? 0) + step)
  })
  const segments = flat.map((point) => point.segment)

  const elevations = fillElevations(
    flat.map((point) => point.ele),
    distances,
  )
  const smoothed = elevations && smoothOverDistance(elevations, distances, SMOOTHING_WINDOW_M)
  const grades = smoothed ? computeGrades(smoothed, distances, segments) : flat.map(() => 0)

  const points: AnalyzedPoint[] = flat.map((point, index) => ({
    lat: point.lat,
    lon: point.lon,
    ...projection.project(point.lat, point.lon),
    ele: elevations?.[index] ?? null,
    smoothEle: smoothed?.[index] ?? null,
    distance: distances[index],
    grade: grades[index],
    time: point.time,
    segment: point.segment,
  }))

  let gain: number | null = null
  let loss: number | null = null
  if (elevations) {
    gain = 0
    loss = 0
    for (const [start, end] of segmentRanges(segments)) {
      const totals = elevationGainLoss(elevations.slice(start, end))
      gain += totals.gain
      loss += totals.loss
    }
  }

  const bounds: TrackBounds = { minX: Infinity, maxX: -Infinity, minY: Infinity, maxY: -Infinity }
  for (const { x, y } of points) {
    bounds.minX = Math.min(bounds.minX, x)
    bounds.maxX = Math.max(bounds.maxX, x)
    bounds.minY = Math.min(bounds.minY, y)
    bounds.maxY = Math.max(bounds.maxY, y)
  }

  const hasTime = flat.filter((point) => point.time !== null).length >= 2
  const elevationRange = elevations && minMax(elevations)
  const gradeRange = minMax(grades)

  return {
    name: track.name,
    points,
    bounds,
    hasElevation: elevations !== null,
    hasTime,
    stats: {
      distance: distances[distances.length - 1],
      gain,
      loss,
      minEle: elevationRange?.min ?? null,
      maxEle: elevationRange?.max ?? null,
      startEle: elevations ? elevations[0] : null,
      endEle: elevations ? elevations[elevations.length - 1] : null,
      maxGrade: smoothed ? Math.max(0, gradeRange.max) : null,
      minGrade: smoothed ? Math.min(0, gradeRange.min) : null,
      ...computeTimeStats(points, segments),
      pointCount: points.length,
      segmentCount: track.segments.length,
    },
  }
}
