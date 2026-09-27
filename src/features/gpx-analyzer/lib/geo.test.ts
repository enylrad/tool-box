import { describe, expect, it } from 'vitest'
import { haversineDistance, localProjection } from './geo'

describe('haversineDistance', () => {
  it('is zero for the same point', () => {
    expect(haversineDistance(40, -3, 40, -3)).toBe(0)
  })

  it('measures one degree of latitude as ~111.2 km', () => {
    expect(haversineDistance(0, 0, 1, 0)).toBeCloseTo(111_195, -1)
  })

  it('measures Madrid to Barcelona as ~505 km', () => {
    expect(haversineDistance(40.4168, -3.7038, 41.3874, 2.1686) / 1000).toBeCloseTo(505, 0)
  })
})

describe('localProjection', () => {
  it('maps the center to the origin, north to +y and east to +x', () => {
    const { project } = localProjection(45, 10)
    expect(project(45, 10)).toEqual({ x: 0, y: 0 })
    expect(project(45.01, 10).y).toBeGreaterThan(0)
    expect(project(45, 10.01).x).toBeGreaterThan(0)
  })

  it('agrees with haversine for short distances', () => {
    const { project } = localProjection(45, 10)
    const a = project(45.001, 10.002)
    const b = project(44.999, 9.998)
    expect(Math.hypot(a.x - b.x, a.y - b.y)).toBeCloseTo(haversineDistance(45.001, 10.002, 44.999, 9.998), 0)
  })
})
