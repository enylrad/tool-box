export interface ExtractionResult {
  text: string
  source: 'image' | 'pdf'
  pageCount: number
  /** Pages whose text came from OCR rather than from the PDF's embedded text. */
  ocrPageCount: number
  /** Mean OCR confidence (0–100) over the OCR pages, or null if none needed OCR. */
  confidence: number | null
}

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`

/** One-line summary shown in the toolbar once extraction has finished. */
export function describeResult({ source, pageCount, ocrPageCount, confidence }: ExtractionResult): string {
  const confidenceText = confidence === null ? '' : `${Math.round(confidence)}% confidence`
  if (source === 'image') return `Done · ${confidenceText}`
  const pages = plural(pageCount, 'page')
  if (ocrPageCount === 0) return `Done · ${pages} · embedded text`
  if (ocrPageCount === pageCount) return `Done · ${pages} · OCR, ${confidenceText}`
  return `Done · ${pages} · ${ocrPageCount} with OCR, ${confidenceText}`
}
