import { describe, expect, it } from 'vitest'
import { dataUrlToText, isSvgDataUrl, withIntrinsicSize } from './svg'

describe('dataUrlToText', () => {
  it('decodes base64 data URLs as UTF-8', () => {
    const text = '<svg><title>Ñandú ✓</title></svg>'
    const base64 = btoa(String.fromCharCode(...new TextEncoder().encode(text)))
    expect(dataUrlToText(`data:image/svg+xml;base64,${base64}`)).toBe(text)
  })

  it('decodes percent-encoded data URLs', () => {
    expect(dataUrlToText(`data:image/svg+xml;charset=utf-8,${encodeURIComponent('<svg a="1"/>')}`)).toBe('<svg a="1"/>')
  })

  it('rejects other strings', () => {
    expect(() => dataUrlToText('https://example.com')).toThrow()
  })
})

describe('isSvgDataUrl', () => {
  it('detects SVG data URLs', () => {
    expect(isSvgDataUrl('data:image/svg+xml;base64,AAA')).toBe(true)
    expect(isSvgDataUrl('data:image/png;base64,AAA')).toBe(false)
  })
})

describe('withIntrinsicSize', () => {
  it('keeps SVGs that already have a pixel size', () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg" width="64" height="32"></svg>'
    expect(withIntrinsicSize(svg)).toEqual({ svg, width: 64, height: 32 })
  })

  it('sizes SVGs from their viewBox', () => {
    const result = withIntrinsicSize('<?xml version="1.0"?>\n<svg viewBox="0 0 200 100" width="100%"><rect stroke-width="2"/></svg>')
    expect(result.width).toBe(200)
    expect(result.height).toBe(100)
    expect(result.svg).toBe('<?xml version="1.0"?>\n<svg viewBox="0 0 200 100" width="200" height="100"><rect stroke-width="2"/></svg>')
  })

  it('derives the missing dimension from the viewBox aspect ratio', () => {
    const result = withIntrinsicSize('<svg viewBox="0,0,40,20" width="80"></svg>')
    expect(result).toMatchObject({ width: 80, height: 40 })
  })

  it('falls back to a square size without any sizing information', () => {
    expect(withIntrinsicSize('<svg/>')).toEqual({ svg: '<svg width="512" height="512"/>', width: 512, height: 512 })
  })

  it('rejects files that are not SVG', () => {
    expect(() => withIntrinsicSize('<html></html>')).toThrow()
  })
})
