import { haversineDistance } from './geo'

/** File name shown for the built-in example. */
export const SAMPLE_FILE_NAME = 'sample-mountain-loop.gpx'

const POINT_COUNT = 1200
const CENTER = { lat: 42.64, lon: 0.64 }
const START_TIME = Date.UTC(2026, 6, 12, 7, 30)

/**
 * Builds a made-up 20 km mountain loop with a long main climb, a second smaller
 * one and timestamps, so the tool can be tried without a GPX file at hand.
 */
export function createSampleGpx(): string {
  const points: { lat: number; lon: number; ele: number }[] = []
  for (let index = 0; index < POINT_COUNT; index++) {
    const t = index / (POINT_COUNT - 1)
    const angle = t * Math.PI * 2
    const radius = 1 + 0.18 * Math.sin(angle * 3) + 0.07 * Math.sin(angle * 7)
    const lat = CENTER.lat + 0.022 * radius * Math.sin(angle)
    const lon = CENTER.lon + 0.036 * radius * Math.cos(angle) - 0.036
    const mainClimb = 720 * Math.exp(-(((t - 0.36) / 0.2) ** 2))
    const secondClimb = 240 * Math.exp(-(((t - 0.74) / 0.09) ** 2))
    const rolling = 12 * Math.sin(angle * 9) + 1.5 * Math.sin(index * 1.7)
    points.push({ lat, lon, ele: 1180 + mainClimb + secondClimb + rolling })
  }

  let time = START_TIME
  const trackPoints = points.map((point, index) => {
    const previous = points[index - 1]
    if (previous) {
      const meters = haversineDistance(previous.lat, previous.lon, point.lat, point.lon)
      const grade = meters > 0 ? (point.ele - previous.ele) / meters : 0
      // Tobler's hiking function: slower uphill and on steep downhill.
      const speed = (6 * Math.exp(-3.5 * Math.abs(grade + 0.05)) * 1000) / 3600
      time += (meters / speed) * 1000
    }
    return `      <trkpt lat="${point.lat.toFixed(6)}" lon="${point.lon.toFixed(6)}"><ele>${point.ele.toFixed(1)}</ele><time>${new Date(Math.round(time)).toISOString()}</time></trkpt>`
  })

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Tool Box" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata><name>Sample mountain loop</name></metadata>
  <trk>
    <name>Sample mountain loop</name>
    <trkseg>
${trackPoints.join('\n')}
    </trkseg>
  </trk>
</gpx>
`
}
