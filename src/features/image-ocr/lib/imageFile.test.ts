import { describe, expect, it } from 'vitest'
import { findImageFile, isSupportedImage, toTextFileName } from './imageFile'

const file = (name: string, type: string) => new File(['x'], name, { type })

describe('isSupportedImage', () => {
  it('accepts common image formats', () => {
    expect(isSupportedImage(file('a.png', 'image/png'))).toBe(true)
    expect(isSupportedImage(file('a.jpg', 'image/jpeg'))).toBe(true)
  })

  it('rejects other files', () => {
    expect(isSupportedImage(file('a.pdf', 'application/pdf'))).toBe(false)
    expect(isSupportedImage(file('a.svg', 'image/svg+xml'))).toBe(false)
  })
})

describe('findImageFile', () => {
  it('returns the first supported image', () => {
    const image = file('photo.webp', 'image/webp')
    expect(findImageFile([file('notes.txt', 'text/plain'), image])).toBe(image)
  })

  it('returns null when there is no image', () => {
    expect(findImageFile([file('notes.txt', 'text/plain')])).toBeNull()
    expect(findImageFile(null)).toBeNull()
  })
})

describe('toTextFileName', () => {
  it('replaces the image extension', () => {
    expect(toTextFileName('Factura Enero.final.PNG')).toBe('factura-enero-final.txt')
  })

  it('falls back to a default name', () => {
    expect(toTextFileName('.png')).toBe('extracted-text.txt')
  })
})
