import type { PDFDocumentProxy, PDFPageProxy } from 'pdfjs-dist'
import { getPdfAssetUrls, getSiteUrl } from './assetUrls'

/** An error whose message can be shown to the user as is. */
export class PdfOpenError extends Error {}

/**
 * Opens a PDF with pdf.js, which is loaded on demand from this site (worker,
 * fonts and decoders included), so nothing is fetched from a CDN.
 */
export async function openPdf(file: Blob): Promise<PDFDocumentProxy> {
  // The legacy build polyfills recent JavaScript features that pdf.js relies on
  // (e.g. Map.prototype.getOrInsertComputed), which many browsers still lack.
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs')
  const { workerSrc, ...dataUrls } = getPdfAssetUrls(getSiteUrl())
  pdfjs.GlobalWorkerOptions.workerSrc = workerSrc
  const data = new Uint8Array(await file.arrayBuffer())
  try {
    return await pdfjs.getDocument({ data, ...dataUrls }).promise
  } catch (cause) {
    if (cause instanceof pdfjs.PasswordException) {
      throw new PdfOpenError('This PDF is password protected. Remove the password and try again.', { cause })
    }
    if (cause instanceof pdfjs.InvalidPDFException) {
      throw new PdfOpenError('This file is not a valid PDF or it is damaged.', { cause })
    }
    throw cause
  }
}

/** Renders a page onto a new canvas at the given scale. */
export async function renderPage(page: PDFPageProxy, scale: number): Promise<HTMLCanvasElement> {
  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width)
  canvas.height = Math.floor(viewport.height)
  // Paint a white background: OCR and previews expect dark text on white.
  const context = canvas.getContext('2d')
  if (context) {
    context.fillStyle = '#ffffff'
    context.fillRect(0, 0, canvas.width, canvas.height)
  }
  await page.render({ canvas, viewport }).promise
  return canvas
}

/** Frees a canvas' pixel buffer right away instead of waiting for garbage collection. */
export function releaseCanvas(canvas: HTMLCanvasElement) {
  canvas.width = 0
  canvas.height = 0
}
