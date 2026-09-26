import { useEffect, useEffectEvent, useState } from 'react'
import { findSupportedFile, isPdf } from '../lib/sourceFile'

interface SourceFile {
  file: File
  /** Object URL used to preview an image; PDFs are previewed with usePdfPreview. */
  imageUrl: string | null
}

interface UseSourceFileOptions {
  /** Called whenever a new file is chosen, dropped or pasted. */
  onSelect: (file: File) => void
  /** Ignore new files, e.g. while the current one is being processed. */
  disabled?: boolean
}

/**
 * The image or PDF to extract text from. Files can be picked, dropped, or
 * pasted anywhere on the page with Ctrl+V / ⌘V.
 */
export function useSourceFile({ onSelect, disabled = false }: UseSourceFileOptions) {
  const [source, setSource] = useState<SourceFile | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Release the previous preview once it is replaced or the page is left.
  useEffect(() => {
    const imageUrl = source?.imageUrl
    if (!imageUrl) return
    return () => URL.revokeObjectURL(imageUrl)
  }, [source])

  const applyFile = (file: File) => {
    if (disabled) return
    setSource({ file, imageUrl: isPdf(file) ? null : URL.createObjectURL(file) })
    setError(null)
    onSelect(file)
  }

  /** Uses the first supported file from a file list, or reports an error if there is none. */
  const selectFiles = (files: Iterable<File> | ArrayLike<File> | null | undefined) => {
    const file = findSupportedFile(files)
    if (file) {
      applyFile(file)
    } else {
      setError('Unsupported file. Use a PNG, JPEG, WebP, BMP or GIF image, or a PDF.')
    }
  }

  const clearFile = () => {
    setSource(null)
    setError(null)
  }

  const handlePaste = useEffectEvent((event: ClipboardEvent) => {
    // Let text fields handle their own pastes.
    if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]')) return
    const file = findSupportedFile(event.clipboardData?.files)
    if (!file) return
    event.preventDefault()
    applyFile(file)
  })

  useEffect(() => {
    const listener = (event: ClipboardEvent) => handlePaste(event)
    window.addEventListener('paste', listener)
    return () => window.removeEventListener('paste', listener)
  }, [])

  return { file: source?.file ?? null, imageUrl: source?.imageUrl ?? null, error, selectFiles, clearFile }
}
