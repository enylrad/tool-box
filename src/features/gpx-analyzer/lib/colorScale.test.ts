import { describe, expect, it } from 'vitest'
import { DEFAULT_TRACK_COLOR, ELEVATION_STOPS, GRADE_BANDS, elevationColor, gradeColor, pointColorer } from './colorScale'

describe('gradeColor', () => {
  it('picks the band containing the grade', () => {
    expect(gradeColor(-30)).toBe(GRADE_BANDS[0].color)
    expect(gradeColor(0)).toBe('#22c55e')
    expect(gradeColor(4)).toBe('#eab308')
    expect(gradeColor(25)).toBe('#7f1d1d')
  })
})

describe('elevationColor', () => {
  it('maps the range onto the gradient stops', () => {
    expect(elevationColor(100, 100, 200)).toBe(ELEVATION_STOPS[0])
    expect(elevationColor(200, 100, 200)).toBe(ELEVATION_STOPS[ELEVATION_STOPS.length - 1])
    expect(elevationColor(150, 100, 200)).toBe(ELEVATION_STOPS[2])
    expect(elevationColor(500, 100, 100)).toBe(ELEVATION_STOPS[0])
  })
})

describe('pointColorer', () => {
  it('uses a plain color without elevation data', () => {
    expect(pointColorer('grade', null, null)({ smoothEle: null, grade: 0 })).toBe(DEFAULT_TRACK_COLOR)
    expect(pointColorer('grade', 0, 10)({ smoothEle: 5, grade: 9 })).toBe('#f97316')
  })
})
