/** Tesseract language codes. `+` combines languages in a single pass. */
export type OcrLanguage = 'eng' | 'spa' | 'eng+spa'

export interface OcrLanguageOption {
  code: OcrLanguage
  label: string
}

/**
 * Languages offered in the UI. Their data is bundled with the site by
 * scripts/copy-ocr-assets.mjs, so keep both lists in sync.
 */
export const OCR_LANGUAGES: OcrLanguageOption[] = [
  { code: 'eng', label: 'English' },
  { code: 'spa', label: 'Spanish' },
  { code: 'eng+spa', label: 'English + Spanish' },
]

export const DEFAULT_OCR_LANGUAGE: OcrLanguage = 'eng'

export function isOcrLanguage(value: unknown): value is OcrLanguage {
  return OCR_LANGUAGES.some((option) => option.code === value)
}

