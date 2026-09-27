/** One recorded or planned position. `time` is in milliseconds since the epoch. */
export interface TrackPoint {
  lat: number
  lon: number
  ele: number | null
  time: number | null
}

export interface GpxTrack {
  name: string | null
  /** Continuous pieces of the route. Distance is not measured across the gap between two segments. */
  segments: TrackPoint[][]
}

export class GpxParseError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GpxParseError'
  }
}

/** Children of `parent` with the given local name, ignoring XML namespaces (GPX 1.0, 1.1 and extensions). */
function childrenNamed(parent: Element | Document, name: string): Element[] {
  const children = parent instanceof Document ? [parent.documentElement] : Array.from(parent.children)
  return children.filter((child) => child.localName === name)
}

function descendantsNamed(parent: Element, name: string): Element[] {
  return Array.from(parent.getElementsByTagNameNS('*', name))
}

function childText(parent: Element, name: string): string | null {
  const text = childrenNamed(parent, name)[0]?.textContent?.trim()
  return text ? text : null
}

function parseNumber(text: string | null): number | null {
  if (text === null) return null
  const value = Number(text)
  return Number.isFinite(value) ? value : null
}

function parsePoint(element: Element): TrackPoint | null {
  const lat = parseNumber(element.getAttribute('lat'))
  const lon = parseNumber(element.getAttribute('lon'))
  if (lat === null || lon === null || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null
  const timeText = childText(element, 'time')
  const time = timeText === null ? NaN : Date.parse(timeText)
  return {
    lat,
    lon,
    ele: parseNumber(childText(element, 'ele')),
    time: Number.isFinite(time) ? time : null,
  }
}

function parsePoints(elements: Element[]): TrackPoint[] {
  return elements.map(parsePoint).filter((point): point is TrackPoint => point !== null)
}

/**
 * Reads the tracks (`trk/trkseg/trkpt`) of a GPX document. Files with only
 * routes (`rte/rtept`) are read as a route instead.
 */
export function parseGpx(xml: string): GpxTrack {
  const document = new DOMParser().parseFromString(xml, 'application/xml')
  const root = document.documentElement
  if (document.getElementsByTagName('parsererror').length > 0 || root.localName !== 'gpx') {
    throw new GpxParseError('This is not a valid GPX file.')
  }

  const tracks = childrenNamed(root, 'trk')
  let segments = tracks.flatMap((track) => childrenNamed(track, 'trkseg').map((segment) => parsePoints(childrenNamed(segment, 'trkpt'))))
  if (segments.every((segment) => segment.length === 0)) {
    segments = childrenNamed(root, 'rte').map((route) => parsePoints(childrenNamed(route, 'rtept')))
  }
  segments = segments.filter((segment) => segment.length > 0)

  if (segments.length === 0) {
    const hasWaypoints = descendantsNamed(root, 'wpt').length > 0
    throw new GpxParseError(
      hasWaypoints ? 'This GPX file only has waypoints, not a track or route.' : 'This GPX file has no track or route points.',
    )
  }
  if (segments.reduce((count, segment) => count + segment.length, 0) < 2) {
    throw new GpxParseError('The track needs at least two points.')
  }

  const metadata = childrenNamed(root, 'metadata')[0]
  const name =
    (metadata && childText(metadata, 'name')) ??
    (tracks[0] && childText(tracks[0], 'name')) ??
    (childrenNamed(root, 'rte')[0] && childText(childrenNamed(root, 'rte')[0], 'name')) ??
    null

  return { name, segments }
}
