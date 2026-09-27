import { getTag, tagNumber, tagText, type MetadataTags } from './tags'

export interface GpsLocation {
  latitude: number
  longitude: number
  /** Metres above (positive) or below (negative) sea level. */
  altitude?: number
  /** Compass direction the camera was pointing, in degrees. */
  direction?: number
  directionRef?: string
  /** Estimated horizontal error in metres. */
  accuracy?: number
  speed?: string
  /** UTC date and time reported by the GPS receiver. */
  timestamp?: string
}

function isValidCoordinate(latitude: number, longitude: number) {
  return Number.isFinite(latitude) && Number.isFinite(longitude) && Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180
}

function gpsTimestamp(tags: MetadataTags) {
  const date = tagText(tags, 'GPSDateStamp', ['exif'])
  const time = getTag(tags, 'GPSTimeStamp', ['exif'])?.value
  let clock: string | undefined
  if (Array.isArray(time) && time.length === 3) {
    const parts = time.map((part) => (Array.isArray(part) && part[1] ? part[0] / part[1] : Number(part)))
    if (parts.every(Number.isFinite)) {
      const [hours, minutes, seconds] = parts
      clock = [hours, minutes, Math.floor(seconds)].map((part) => String(Math.floor(part)).padStart(2, '0')).join(':')
    }
  }
  if (!date && !clock) return undefined
  return `${date?.replace(/:/g, '-') ?? ''} ${clock ?? ''} UTC`.trim()
}

/** GPS position from EXIF (or XMP), or null when the photo has no location. */
export function readGpsLocation(tags: MetadataTags): GpsLocation | null {
  let latitude = tags.gps?.Latitude
  let longitude = tags.gps?.Longitude
  if (latitude === undefined || longitude === undefined) {
    // XMP stores coordinates as text such as "40,25.2N".
    latitude = parseXmpCoordinate(tagText(tags, 'GPSLatitude', ['xmp']))
    longitude = parseXmpCoordinate(tagText(tags, 'GPSLongitude', ['xmp']))
  }
  if (latitude === undefined || longitude === undefined || !isValidCoordinate(latitude, longitude)) return null
  // Some devices write 0,0 when there was no fix.
  if (latitude === 0 && longitude === 0) return null

  const speed = tagNumber(tags, 'GPSSpeed', ['exif'])
  const speedUnit = { K: 'km/h', M: 'mph', N: 'knots' }[String(getTag(tags, 'GPSSpeedRef', ['exif'])?.value ?? 'K').charAt(0)] ?? 'km/h'
  return {
    latitude,
    longitude,
    altitude: tags.gps?.Altitude,
    direction: tagNumber(tags, 'GPSImgDirection', ['exif']),
    directionRef: tagText(tags, 'GPSImgDirectionRef', ['exif']),
    accuracy: tagNumber(tags, 'GPSHPositioningError', ['exif']),
    speed: speed !== undefined ? `${Number(speed.toFixed(1))} ${speedUnit}` : undefined,
    timestamp: gpsTimestamp(tags),
  }
}

export function parseXmpCoordinate(text: string | undefined) {
  const match = text && /^(\d+),(\d+(?:\.\d+)?)(?:,(\d+(?:\.\d+)?))?([NSEW])$/i.exec(text.trim())
  if (!match) return undefined
  const [, degrees, minutes, seconds = '0', ref] = match
  const value = Number(degrees) + Number(minutes) / 60 + Number(seconds) / 3600
  return /[SW]/i.test(ref) ? -value : value
}

/** `40° 25′ 12.3″ N` */
export function toDms(decimal: number, axis: 'lat' | 'lon') {
  const hemisphere = axis === 'lat' ? (decimal >= 0 ? 'N' : 'S') : decimal >= 0 ? 'E' : 'W'
  const absolute = Math.abs(decimal)
  let degrees = Math.floor(absolute)
  let minutes = Math.floor((absolute - degrees) * 60)
  let seconds = Number(((absolute - degrees - minutes / 60) * 3600).toFixed(1))
  if (seconds >= 60) {
    seconds = 0
    minutes += 1
  }
  if (minutes >= 60) {
    minutes = 0
    degrees += 1
  }
  return `${degrees}° ${minutes}′ ${seconds}″ ${hemisphere}`
}

export function formatCoordinates({ latitude, longitude }: Pick<GpsLocation, 'latitude' | 'longitude'>) {
  return `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
}

export function googleMapsUrl({ latitude, longitude }: Pick<GpsLocation, 'latitude' | 'longitude'>) {
  return `https://www.google.com/maps/search/?api=1&query=${latitude.toFixed(6)},${longitude.toFixed(6)}`
}

export function openStreetMapUrl({ latitude, longitude }: Pick<GpsLocation, 'latitude' | 'longitude'>) {
  const lat = latitude.toFixed(6)
  const lon = longitude.toFixed(6)
  return `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lon}#map=17/${lat}/${lon}`
}

const COMPASS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW']

/** `123° (SE)` */
export function formatDirection(degrees: number) {
  const normalized = ((degrees % 360) + 360) % 360
  return `${Math.round(normalized)}° (${COMPASS[Math.round(normalized / 45) % 8]})`
}

export function formatAltitude(metres: number) {
  const rounded = Number(metres.toFixed(1))
  return rounded < 0 ? `${-rounded} m below sea level` : `${rounded} m above sea level`
}
