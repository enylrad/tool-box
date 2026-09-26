import { describe, expect, it } from 'vitest'
import { composeLayout } from './layout'
import { createQrMatrix } from './qrMatrix'
import { renderQrSvg, type SvgStyle } from './svgRenderer'

const STYLE: SvgStyle = {
  foreground: '#112233',
  background: '#ffffff',
  transparentBackground: false,
  moduleShape: 'square',
}

const layout = composeLayout(createQrMatrix('svg test', 'M'), { margin: 4 })

function parse(svg: string): Document {
  const document = new DOMParser().parseFromString(svg, 'image/svg+xml')
  expect(document.querySelector('parsererror')).toBeNull()
  return document
}

describe('renderQrSvg', () => {
  it('produces well-formed SVG in module units', () => {
    const svg = renderQrSvg(layout, STYLE)
    const root = parse(svg).documentElement
    expect(root.getAttribute('viewBox')).toBe(`0 0 ${layout.gridSize} ${layout.gridSize}`)
    expect(root.querySelector('rect')?.getAttribute('fill')).toBe('#ffffff')
    expect(svg).toContain('fill="#112233"')
    expect(svg).toContain('fill-rule="evenodd"')
  })

  it('omits the background when transparent', () => {
    expect(renderQrSvg(layout, { ...STYLE, transparentBackground: true })).not.toContain('<rect')
  })

  it.each(['square', 'rounded', 'dots'] as const)('renders %s modules', (moduleShape) => {
    parse(renderQrSvg(layout, { ...STYLE, moduleShape }))
  })

  it('keeps function patterns solid when modules are dots, so scanners can find the grid', () => {
    const versionFive = composeLayout(createQrMatrix('x'.repeat(80), 'M'), { margin: 4 })
    const modulesPath = parse(renderQrSvg(versionFive, { ...STYLE, moduleShape: 'dots' })).querySelector('path')!.getAttribute('d')!
    // Timing and alignment patterns are drawn as rectangles ("h…v1h-…z"), data modules as arcs.
    expect(modulesPath).toMatch(/^M\d+ \d+h\d+v1h-\d+z/)
    expect(modulesPath).toContain('a0.45 0.45')
  })

  it('replaces invalid colors instead of injecting them', () => {
    const svg = renderQrSvg(layout, { ...STYLE, foreground: '"/><script>alert(1)</script>' })
    expect(svg).not.toContain('<script')
    expect(svg).toContain('fill="#000000"')
  })

  it('embeds the logo as an escaped data URL inside the logo box', () => {
    const logoLayout = composeLayout(createQrMatrix('logo', 'H'), { margin: 4, logoSizeRatio: 0.25 })
    const svg = renderQrSvg(logoLayout, STYLE, 'data:image/png;base64,AAA"<x>')
    const image = parse(svg).querySelector('image')!
    expect(image.getAttribute('href')).toBe('data:image/png;base64,AAA"<x>')
    expect(Number(image.getAttribute('x'))).toBeGreaterThan(logoLayout.logoBox!.col)
  })

  it('does not reference external resources', () => {
    const svg = renderQrSvg(layout, STYLE)
    expect(svg.match(/https?:\/\/[^"]+/g)).toEqual(['http://www.w3.org/2000/svg', 'http://www.w3.org/1999/xlink'])
  })
})
