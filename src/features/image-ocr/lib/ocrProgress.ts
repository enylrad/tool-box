/** A progress message as reported by the Tesseract.js logger. */
export interface OcrProgressMessage {
  status: string
  progress: number
}

export interface OcrProgress {
  label: string
  /** 0–100 */
  percent: number
}

const STATUS_LABELS: Record<string, string> = {
  'loading tesseract core': 'Loading OCR engine…',
  'initializing tesseract': 'Starting OCR engine…',
  'loading language traineddata': 'Loading language data…',
  'initializing api': 'Preparing recognizer…',
  'recognizing text': 'Recognizing text…',
}

/** Turns a Tesseract.js progress message into a label and a percentage for the UI. */
export function describeProgress({ status, progress }: OcrProgressMessage): OcrProgress {
  const label = STATUS_LABELS[status] ?? `${status.charAt(0).toUpperCase()}${status.slice(1)}…`
  const ratio = Number.isFinite(progress) ? Math.min(Math.max(progress, 0), 1) : 0
  return { label, percent: Math.round(ratio * 100) }
}
