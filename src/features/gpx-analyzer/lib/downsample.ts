/**
 * Picks at most about `maxPoints` indices, spread evenly by distance, always
 * keeping the first and last point of every segment. Used to keep the 3D
 * geometry light for tracks with tens of thousands of points.
 */
export function sampleIndices(points: readonly { distance: number; segment: number }[], maxPoints: number): number[] {
  if (points.length <= maxPoints) return points.map((_, index) => index)
  const total = points[points.length - 1].distance
  const spacing = total / Math.max(1, maxPoints - 1)
  const indices: number[] = []
  let nextDistance = 0
  points.forEach((point, index) => {
    const isSegmentEdge = index === 0 || index === points.length - 1 || point.segment !== points[index - 1].segment || point.segment !== points[index + 1].segment
    if (isSegmentEdge || point.distance >= nextDistance) {
      indices.push(index)
      nextDistance = point.distance + spacing
    }
  })
  return indices
}
