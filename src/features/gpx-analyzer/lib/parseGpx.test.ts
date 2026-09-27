import { describe, expect, it } from 'vitest'
import { GpxParseError, parseGpx } from './parseGpx'

const gpx = (body: string, attributes = 'xmlns="http://www.topografix.com/GPX/1/1"') =>
  `<?xml version="1.0"?><gpx version="1.1" ${attributes}>${body}</gpx>`

describe('parseGpx', () => {
  it('reads track points with elevation and time', () => {
    const track = parseGpx(
      gpx(`<metadata><name>Morning ride</name></metadata><trk><trkseg>
        <trkpt lat="42.5" lon="1.5"><ele>1000.5</ele><time>2026-01-01T10:00:00Z</time></trkpt>
        <trkpt lat="42.6" lon="1.6"><ele>1010</ele><time>2026-01-01T10:05:00Z</time></trkpt>
      </trkseg></trk>`),
    )
    expect(track.name).toBe('Morning ride')
    expect(track.segments).toEqual([
      [
        { lat: 42.5, lon: 1.5, ele: 1000.5, time: Date.UTC(2026, 0, 1, 10, 0) },
        { lat: 42.6, lon: 1.6, ele: 1010, time: Date.UTC(2026, 0, 1, 10, 5) },
      ],
    ])
  })

  it('keeps segments and tracks separate and uses the track name', () => {
    const track = parseGpx(
      gpx(`<trk><name>Two parts</name>
        <trkseg><trkpt lat="1" lon="1"/><trkpt lat="1.1" lon="1"/></trkseg>
        <trkseg><trkpt lat="2" lon="2"/></trkseg>
      </trk><trk><trkseg><trkpt lat="3" lon="3"/></trkseg></trk>`),
    )
    expect(track.name).toBe('Two parts')
    expect(track.segments.map((segment) => segment.length)).toEqual([2, 1, 1])
  })

  it('falls back to routes when there are no tracks', () => {
    const track = parseGpx(gpx('<rte><name>Plan</name><rtept lat="1" lon="1"/><rtept lat="1.01" lon="1.01"/></rte>'))
    expect(track.name).toBe('Plan')
    expect(track.segments[0]).toHaveLength(2)
  })

  it('works without a namespace (GPX 1.0 style) and without elevation or time', () => {
    const track = parseGpx(gpx('<trk><trkseg><trkpt lat="1" lon="1"/><trkpt lat="1" lon="1.001"/></trkseg></trk>', ''))
    expect(track.name).toBeNull()
    expect(track.segments[0][0]).toEqual({ lat: 1, lon: 1, ele: null, time: null })
  })

  it('skips points with invalid coordinates', () => {
    const track = parseGpx(gpx('<trk><trkseg><trkpt lat="x" lon="1"/><trkpt lat="1" lon="1"/><trkpt lat="95" lon="1"/><trkpt lat="1" lon="2"/></trkseg></trk>'))
    expect(track.segments[0]).toHaveLength(2)
  })

  it('rejects files that are not GPX or have no usable points', () => {
    expect(() => parseGpx('not xml at all <')).toThrow(GpxParseError)
    expect(() => parseGpx('<kml></kml>')).toThrow('not a valid GPX')
    expect(() => parseGpx(gpx('<wpt lat="1" lon="1"/>'))).toThrow('only has waypoints')
    expect(() => parseGpx(gpx('<trk><trkseg></trkseg></trk>'))).toThrow('no track or route points')
    expect(() => parseGpx(gpx('<trk><trkseg><trkpt lat="1" lon="1"/></trkseg></trk>'))).toThrow('at least two points')
  })
})
