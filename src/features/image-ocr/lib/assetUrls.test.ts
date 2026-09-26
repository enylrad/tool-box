import { describe, expect, it } from 'vitest'
import { getPdfAssetUrls, getTesseractAssetUrls } from './assetUrls'

const SITE_URL = 'https://example.github.io/tool-box/'

describe('getTesseractAssetUrls', () => {
  it('builds absolute URLs under the site base path', () => {
    expect(getTesseractAssetUrls(SITE_URL)).toEqual({
      workerPath: 'https://example.github.io/tool-box/tesseract/worker.min.js',
      corePath: 'https://example.github.io/tool-box/tesseract/core/',
      langPath: 'https://example.github.io/tool-box/tesseract/lang/',
    })
  })
})

describe('getPdfAssetUrls', () => {
  it('builds absolute URLs with trailing slashes for directories', () => {
    expect(getPdfAssetUrls(SITE_URL)).toEqual({
      workerSrc: 'https://example.github.io/tool-box/pdfjs/pdf.worker.min.mjs',
      cMapUrl: 'https://example.github.io/tool-box/pdfjs/cmaps/',
      standardFontDataUrl: 'https://example.github.io/tool-box/pdfjs/standard_fonts/',
      iccUrl: 'https://example.github.io/tool-box/pdfjs/iccs/',
      wasmUrl: 'https://example.github.io/tool-box/pdfjs/wasm/',
    })
  })
})
