import { describe, expect, it } from 'vitest'
import { findSupportedFile, isPdf, isSupportedFile, toTextFileName } from './sourceFile'

const file = (name: string, type: string) => new File(['x'], name, { type })

describe('isSupportedFile', () => {
  it('accepts common image formats and PDFs', () => {
    expect(isSupportedFile(file('a.png', 'image/png'))).toBe(true)
    expect(isSupportedFile(file('a.jpg', 'image/jpeg'))).toBe(true)
    expect(isSupportedFile(file('a.pdf', 'application/pdf'))).toBe(true)
  })

  it('rejects other files', () => {
    expect(isSupportedFile(file('a.txt', 'text/plain'))).toBe(false)
    expect(isSupportedFile(file('a.svg', 'image/svg+xml'))).toBe(false)
  })
})

describe('isPdf', () => {
  it('uses the MIME type', () => {
    expect(isPdf(file('scan', 'application/pdf'))).toBe(true)
    expect(isPdf(file('a.pdf', 'image/png'))).toBe(false)
  })

  it('falls back to the extension when the type is unknown', () => {
    expect(isPdf(file('Invoice.PDF', ''))).toBe(true)
    expect(isPdf(file('notes', ''))).toBe(false)
  })
})

describe('findSupportedFile', () => {
  it('returns the first supported file', () => {
    const pdf = file('report.pdf', 'application/pdf')
    expect(findSupportedFile([file('notes.txt', 'text/plain'), pdf])).toBe(pdf)
  })

  it('returns null when there is no supported file', () => {
    expect(findSupportedFile([file('notes.txt', 'text/plain')])).toBeNull()
    expect(findSupportedFile(null)).toBeNull()
  })
})

describe('toTextFileName', () => {
  it('replaces the source extension', () => {
    expect(toTextFileName('Factura Enero.final.PNG')).toBe('factura-enero-final.txt')
    expect(toTextFileName('contract.pdf')).toBe('contract.txt')
  })

  it('falls back to a default name', () => {
    expect(toTextFileName('.png')).toBe('extracted-text.txt')
  })
})
