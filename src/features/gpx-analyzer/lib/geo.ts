const EARTH_RADIUS_M = 6_371_008.8
const toRadians = (degrees: number) => (degrees * Math.PI) / 180

/** Great-circle distance in meters between two coordinates (haversine formula). */
export function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const dLat = toRadians(lat2 - lat1)
  const dLon = toRadians(lon2 - lon1)
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * EARTH_RADIUS_M * Math.asin(Math.min(1, Math.sqrt(a)))
}

export interface LocalProjection {
  /** Meters east (x) and north (y) of the projection center. */
  project: (lat: number, lon: number) => { x: number; y: number }
}

/**
 * Equirectangular projection around a center point. Accurate enough to draw a
 * route of a few hundred kilometers in meters, and trivial to compute.
 */
export function localProjection(centerLat: number, centerLon: number): LocalProjection {
  const metersPerDegreeLat = (Math.PI / 180) * EARTH_RADIUS_M
  const metersPerDegreeLon = metersPerDegreeLat * Math.cos(toRadians(centerLat))
  return {
    project: (lat, lon) => ({
      x: (lon - centerLon) * metersPerDegreeLon,
      y: (lat - centerLat) * metersPerDegreeLat,
    }),
  }
}
