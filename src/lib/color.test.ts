import { describe, expect, it } from 'vitest'
import { contrastRatio, isHexColor, relativeLuminance, toSafeHexColor } from './color'

describe('color helpers', () => {
  it('validates #rrggbb colors', () => {
    expect(isHexColor('#0F172a')).toBe(true)
    expect(isHexColor('#fff')).toBe(false)
    expect(isHexColor('red" onload="x')).toBe(false)
  })

  it('falls back for unsafe values', () => {
    expect(toSafeHexColor('#ABCDEF', '#000000')).toBe('#abcdef')
    expect(toSafeHexColor('url(javascript:1)', '#000000')).toBe('#000000')
  })

  it('computes luminance and contrast like WCAG', () => {
    expect(relativeLuminance('#000000')).toBe(0)
    expect(relativeLuminance('#ffffff')).toBeCloseTo(1)
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21)
    expect(contrastRatio('#777777', '#777777')).toBeCloseTo(1)
  })
})
