import { toFileName } from '../../../lib/download'

/** Image formats that both browsers and Tesseract.js can read. */
export const SUPPORTED_IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/bmp', 'image/gif']

export function isSupportedImage(file: Pick<File, 'type'>): boolean {
  return SUPPORTED_IMAGE_TYPES.includes(file.type)
}

/** Returns the first supported image among dropped, pasted or picked files. */
export function findImageFile(files: Iterable<File> | ArrayLike<File> | null | undefined): File | null {
  if (!files) return null
  return Array.from(files).find(isSupportedImage) ?? null
}

/** `scan.final.png` → `scan-final.txt` */
export function toTextFileName(imageFileName: string): string {
  const baseName = imageFileName.replace(/\.[^.]+$/, '')
  return toFileName(baseName, 'txt', 'extracted-text')
}
