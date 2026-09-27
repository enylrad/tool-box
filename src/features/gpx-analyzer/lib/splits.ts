import type { AnalyzedPoint } from './trackAnalysis'

export interface Split {
  /** 1-based split number. */
  number: number
  startDistance: number
  length: number
  gain: number | null
  loss: number | null
  /** Milliseconds, when the track has timestamps. */
  duration: number | null
}

/** Picks a split length that keeps the table readable: 1 km, 5 km or 10 km. */
export function splitLengthFor(totalDistance: number): number {
  if (totalDistance <= 60_000) return 1000
  if (totalDistance <= 300_000) return 5000
  return 10_000
}

function interpolate(a: number, b: number, fraction: number) {
  return a + (b - a) * fraction
}

/** Value of a per-point quantity at an exact distance, interpolated between the surrounding points. */
function valueAt(points: readonly AnalyzedPoint[], index: number, distance: number, read: (point: AnalyzedPoint) => number | null) {
  const point = points[index]
  const previous = points[index - 1]
  const current = read(point)
  if (!previous || current === null) return current
  const before = read(previous)
  if (before === null) return current
  const span = point.distance - previous.distance
  return span === 0 ? current : interpolate(before, current, (distance - previous.distance) / span)
}

/** Splits the track every `splitLength` meters with the ascent, descent and time of each piece. */
export function computeSplits(points: readonly AnalyzedPoint[], splitLength = splitLengthFor(points.at(-1)?.distance ?? 0)): Split[] {
  const total = points.at(-1)?.distance ?? 0
  if (total <= 0) return []
  const hasElevation = points[0].smoothEle !== null
  const splits: Split[] = []
  let index = 1
  let startTime = points[0].time
  let lastEle = points[0].smoothEle

  for (let startDistance = 0; startDistance < total; startDistance += splitLength) {
    const endDistance = Math.min(startDistance + splitLength, total)
    let gain = 0
    let loss = 0
    while (index < points.length && points[index].distance < endDistance) {
      const ele = points[index].smoothEle
      if (ele !== null && lastEle !== null && points[index].segment === points[index - 1].segment) {
        if (ele > lastEle) gain += ele - lastEle
        else loss += lastEle - ele
      }
      lastEle = ele
      index++
    }
    const boundaryIndex = Math.min(index, points.length - 1)
    const endEle = valueAt(points, boundaryIndex, endDistance, (point) => point.smoothEle)
    if (endEle !== null && lastEle !== null) {
      if (endEle > lastEle) gain += endEle - lastEle
      else loss += lastEle - endEle
    }
    const endTime = valueAt(points, boundaryIndex, endDistance, (point) => point.time)
    splits.push({
      number: splits.length + 1,
      startDistance,
      length: endDistance - startDistance,
      gain: hasElevation ? gain : null,
      loss: hasElevation ? loss : null,
      duration: startTime !== null && endTime !== null ? endTime - startTime : null,
    })
    lastEle = endEle
    startTime = endTime
  }
  return splits
}
