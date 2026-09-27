import type { AnalyzedPoint } from './trackAnalysis'

export interface Climb {
  startIndex: number
  endIndex: number
  /** Meters along the track. */
  startDistance: number
  length: number
  gain: number
  startEle: number
  endEle: number
  /** Average grade in percent. */
  averageGrade: number
}

/** A climb must gain at least this much to be listed. */
export const MIN_CLIMB_GAIN_M = 30
/** …and be at least this steep on average, so long false flats are not called climbs. */
export const MIN_CLIMB_GRADE = 2
/** A climb ends once the route drops this far below its highest point. */
const DESCENT_TOLERANCE_M = 20

/** Finds the significant climbs of a track, using the smoothed elevation. */
export function findClimbs(points: readonly AnalyzedPoint[]): Climb[] {
  const climbs: Climb[] = []
  if (points.length === 0 || points[0].smoothEle === null) return climbs
  const ele = (index: number) => points[index].smoothEle!

  const close = (startIndex: number, endIndex: number) => {
    const gain = ele(endIndex) - ele(startIndex)
    const length = points[endIndex].distance - points[startIndex].distance
    if (gain < MIN_CLIMB_GAIN_M || length <= 0) return
    const averageGrade = (gain / length) * 100
    if (averageGrade < MIN_CLIMB_GRADE) return
    climbs.push({
      startIndex,
      endIndex,
      startDistance: points[startIndex].distance,
      length,
      gain,
      startEle: ele(startIndex),
      endEle: ele(endIndex),
      averageGrade,
    })
  }

  let startIndex = 0
  let peakIndex = 0
  for (let index = 1; index < points.length; index++) {
    const current = ele(index)
    if (points[index].segment !== points[index - 1].segment) {
      close(startIndex, peakIndex)
      startIndex = peakIndex = index
    } else if (current > ele(peakIndex)) {
      peakIndex = index
    } else if (ele(peakIndex) - current > DESCENT_TOLERANCE_M) {
      close(startIndex, peakIndex)
      startIndex = peakIndex = index
    } else if (current < ele(startIndex)) {
      // Still going down before any real climb started: move the start to the new low point.
      startIndex = peakIndex = index
    }
  }
  close(startIndex, peakIndex)
  return climbs
}
