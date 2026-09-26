import { describe, expect, it } from 'vitest'
import { getTesseractAssetUrls, isOcrLanguage } from './ocrLanguages'

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

describe('getTesseractAssetUrls', () => {
  it('builds absolute URLs under the site base path', () => {
    expect(getTesseractAssetUrls('https://example.github.io/tool-box/')).toEqual({
      workerPath: 'https://example.github.io/tool-box/tesseract/worker.min.js',
      corePath: 'https://example.github.io/tool-box/tesseract/core/',
      langPath: 'https://example.github.io/tool-box/tesseract/lang/',
    })
  })
})
