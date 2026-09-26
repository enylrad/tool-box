import { describe, expect, it } from 'vitest'
import { isOcrLanguage } from './ocrLanguages'

describe('isOcrLanguage', () => {
  it('accepts offered languages', () => {
    expect(isOcrLanguage('spa')).toBe(true)
    expect(isOcrLanguage('eng+spa')).toBe(true)
  })

  it('rejects anything else', () => {
    expect(isOcrLanguage('fra')).toBe(false)
    expect(isOcrLanguage(null)).toBe(false)
  })
})
