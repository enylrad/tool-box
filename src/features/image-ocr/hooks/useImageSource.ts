import { useEffect, useEffectEvent, useState } from 'react'
import { findImageFile } from '../lib/imageFile'

interface ImageSource {
  file: File
  /** Object URL used to preview the image. */
  previewUrl: string
}

interface UseImageSourceOptions {
  /** Called whenever a new image is chosen, dropped or pasted. */
  onSelect: (file: File) => void
  /** Ignore new images, e.g. while the current one is being processed. */
  disabled?: boolean
}

/**
 * The image to run OCR on. Images can be picked, dropped, or pasted anywhere
 * on the page with Ctrl+V / ⌘V.
 */
export function useImageSource({ onSelect, disabled = false }: UseImageSourceOptions) {
  const [source, setSource] = useState<ImageSource | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Release the previous preview once it is replaced or the page is left.
  useEffect(() => {
    if (!source) return
    return () => URL.revokeObjectURL(source.previewUrl)
  }, [source])

  const applyFile = (file: File) => {
    if (disabled) return
    setSource({ file, previewUrl: URL.createObjectURL(file) })
    setError(null)
    onSelect(file)
  }

  /** Uses the first supported image from a file list, or reports an error if there is none. */
  const selectFiles = (files: Iterable<File> | ArrayLike<File> | null | undefined) => {
    const file = findImageFile(files)
    if (file) {
      applyFile(file)
    } else {
      setError('Unsupported file. Use a PNG, JPEG, WebP, BMP or GIF image.')
    }
  }

  const clearImage = () => {
    setSource(null)
    setError(null)
  }

  const handlePaste = useEffectEvent((event: ClipboardEvent) => {
    // Let text fields handle their own pastes.
    if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]')) return
    const file = findImageFile(event.clipboardData?.files)
    if (!file) return
    event.preventDefault()
    applyFile(file)
  })

  useEffect(() => {
    const listener = (event: ClipboardEvent) => handlePaste(event)
    window.addEventListener('paste', listener)
    return () => window.removeEventListener('paste', listener)
  }, [])

  return { image: source?.file ?? null, previewUrl: source?.previewUrl ?? null, error, selectFiles, clearImage }
}
