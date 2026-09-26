import { toFileName } from '../../../lib/download'

/** Image formats that both browsers and Tesseract.js can read. */
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif']
export const PDF_TYPE = 'application/pdf'
export const SUPPORTED_FILE_TYPES = [...SUPPORTED_IMAGE_TYPES, PDF_TYPE]

export function isPdf(file: Pick<File, 'type' | 'name'>): boolean {
  // Some systems report an empty type for PDFs, so fall back to the extension.
  return file.type === PDF_TYPE || (file.type === '' && /\.pdf$/i.test(file.name))
}

export function isSupportedFile(file: Pick<File, 'type' | 'name'>): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type) || isPdf(file)
}

/** Returns the first supported image or PDF among dropped, pasted or picked files. */
export function findSupportedFile(files: Iterable<File> | ArrayLike<File> | null | undefined): File | null {
  if (!files) return null
  return Array.from(files).find(isSupportedFile) ?? null
}

/** `scan.final.png` → `scan-final.txt` */
export function toTextFileName(sourceFileName: string): string {
  const baseName = sourceFileName.replace(/\.[^.]+$/, '')
  return toFileName(baseName, 'txt', 'extracted-text')
}
