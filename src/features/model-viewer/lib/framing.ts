/**
 * Distance from the center of a bounding sphere at which a perspective camera
 * sees the whole sphere, for both its vertical and its horizontal field of view.
 */
export function fitDistance(radius: number, verticalFovDegrees: number, aspect: number, margin = 1.15) {
  const verticalFov = (verticalFovDegrees * Math.PI) / 180
  const horizontalFov = 2 * Math.atan(Math.tan(verticalFov / 2) * aspect)
  const fov = Math.min(verticalFov, horizontalFov)
  return (Math.max(radius, 1e-6) / Math.sin(fov / 2)) * margin
}

/** Near and far clipping planes that keep the model sharp at every zoom level the controls allow. */
export function clipPlanes(radius: number, distance: number) {
  const safeRadius = Math.max(radius, 1e-6)
  return { near: safeRadius / 100, far: (distance + safeRadius) * 20 }
}

/** A "nice" grid size (1, 2 or 5 × 10ⁿ) that is at least `extent`. */
export function gridSizeFor(extent: number) {
  if (!(extent > 0) || !Number.isFinite(extent)) return 1
  const magnitude = 10 ** Math.floor(Math.log10(extent))
  for (const step of [1, 2, 5, 10]) {
    if (step * magnitude >= extent) return step * magnitude
  }
  return 10 * magnitude
}
