/** The parts of a pdf.js text content item that are needed to rebuild the text. */
interface PdfTextItem {
  str: string
  hasEOL?: boolean
}

/**
 * Pages with fewer letters or digits than this are treated as scanned and run
 * through OCR (a scan often only has a page number or a stamp as real text).
 */
export const MIN_EMBEDDED_TEXT_CHARS = 20

/** Pages are rendered at this multiple of 72 DPI before OCR (≈ 216 DPI). */
const OCR_RENDER_SCALE = 3
/** Longest side of a rendered page, to keep memory bounded for huge pages. */
const MAX_RENDER_SIDE_PX = 4000

/** Rebuilds plain text from `page.getTextContent().items`. */
export function textContentToString(items: readonly (PdfTextItem | object)[]): string {
  let text = ''
  for (const item of items) {
    // Marked-content items carry no text.
    if (!('str' in item)) continue
    text += item.str
    if (item.hasEOL) text += '\n'
  }
  return text
    .split('\n')
    .map((line) => line.replace(/\s+$/, ''))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

/** Whether a page's embedded text is worth using instead of running OCR. */
export function hasUsableText(text: string): boolean {
  return (text.match(/[\p{L}\p{N}]/gu)?.length ?? 0) >= MIN_EMBEDDED_TEXT_CHARS
}

/** Joins the text of every page, with a header per page for multi-page documents. */
export function joinPages(pages: readonly string[]): string {
  if (pages.length === 1) return pages[0]
  return pages.map((text, index) => `--- Page ${index + 1} ---\n\n${text}`.trimEnd()).join('\n\n')
}

/** Scale to render a page of `width` × `height` PDF points at for OCR. */
export function ocrRenderScale(width: number, height: number): number {
  const longestSide = Math.max(width, height, 1)
  return Math.min(OCR_RENDER_SCALE, MAX_RENDER_SIDE_PX / longestSide)
}
