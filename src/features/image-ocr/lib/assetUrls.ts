/** Absolute URL of the site root, e.g. `https://user.github.io/tool-box/`. */
export function getSiteUrl(): string {
  return new URL(import.meta.env.BASE_URL, window.location.href).href
}

/**
 * Absolute URLs of the self-hosted Tesseract.js runtime. They must be absolute
 * because the worker resolves relative paths against its own script URL.
 */
export function getTesseractAssetUrls(siteUrl: string) {
  const root = new URL('tesseract/', siteUrl)
  return {
    workerPath: new URL('worker.min.js', root).href,
    // A directory: Tesseract.js picks the fastest core the browser supports.
    corePath: new URL('core/', root).href,
    langPath: new URL('lang/', root).href,
  }
}

/** Absolute URLs of the self-hosted pdf.js worker and the data it loads on demand. */
export function getPdfAssetUrls(siteUrl: string) {
  const root = new URL('pdfjs/', siteUrl)
  return {
    workerSrc: new URL('pdf.worker.min.mjs', root).href,
    cMapUrl: new URL('cmaps/', root).href,
    standardFontDataUrl: new URL('standard_fonts/', root).href,
    iccUrl: new URL('iccs/', root).href,
    wasmUrl: new URL('wasm/', root).href,
  }
}
