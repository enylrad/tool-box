import { describe, expect, it } from 'vitest'
import { toFileName } from './download'

describe('toFileName', () => {
  it('slugifies titles and strips accents', () => {
    expect(toFileName('Guía de Instalación: v2.0!', 'pdf')).toBe('guia-de-instalacion-v2-0.pdf')
  })

  it('falls back when the title has no usable characters', () => {
    expect(toFileName('   ***   ', 'html')).toBe('document.html')
  })

  it('limits the file name length', () => {
    const name = toFileName('a'.repeat(200), 'pdf')
    expect(name.length).toBeLessThanOrEqual(84)
  })
})
