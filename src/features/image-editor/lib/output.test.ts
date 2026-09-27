import { describe, expect, it } from 'vitest'
import { extensionFor, formatLabel, outputFileName, sizeChange } from './output'

describe('outputFileName', () => {
  it('replaces the extension and marks the file as edited', () => {
    expect(outputFileName('IMG_1234.JPG', 'webp')).toBe('img-1234-edited.webp')
    expect(outputFileName('holiday photo.final.png', 'jpg')).toBe('holiday-photo-final-edited.jpg')
    expect(outputFileName('', 'png')).toBe('edited.png')
  })
})

describe('sizeChange', () => {
  it('shows the relative change with a sign', () => {
    expect(sizeChange(1000, 130)).toBe('−87%')
    expect(sizeChange(1000, 1120)).toBe('+12%')
    expect(sizeChange(1000, 1001)).toBe('±0%')
    expect(sizeChange(0, 500)).toBe('')
  })
})

describe('formatLabel', () => {
  it('names common and unknown image types', () => {
    expect(formatLabel('image/jpeg')).toBe('JPEG')
    expect(formatLabel('image/svg+xml')).toBe('SVG')
    expect(formatLabel('image/x-portable-pixmap')).toBe('X-PORTABLE-PIXMAP')
    expect(formatLabel('')).toBe('Unknown')
  })
})

describe('extensionFor', () => {
  it('maps encoder output types to extensions', () => {
    expect(extensionFor('image/jpeg')).toBe('jpg')
    expect(extensionFor('image/webp')).toBe('webp')
    expect(extensionFor('image/png')).toBe('png')
    expect(extensionFor('application/octet-stream')).toBe('png')
  })
})
