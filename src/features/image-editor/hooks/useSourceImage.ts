import { useCallback, useEffect, useRef, useState } from 'react'

const MAX_BYTES = 100 * 1024 * 1024

export interface SourceImage {
  element: HTMLImageElement
  /** Object URL of the original file, revoked when the image is replaced. */
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  /** Natural size, already rotated by the browser for EXIF orientation. */
  width: number
  height: number
}

/** Opens one image file in memory (nothing is uploaded). Opening another replaces it. */
export function useSourceImage() {
  const [image, setImage] = useState<SourceImage | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const currentUrlRef = useRef<string | null>(null)
  // Ignores a slow decode that finishes after a newer file was chosen.
  const loadIdRef = useRef(0)

  const replaceUrl = (url: string | null) => {
    if (currentUrlRef.current) URL.revokeObjectURL(currentUrlRef.current)
    currentUrlRef.current = url
  }

  useEffect(() => () => replaceUrl(null), [])

  const load = useCallback(async (file: File) => {
    const loadId = ++loadIdRef.current
    setError(null)
    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file (JPEG, PNG, WebP, GIF, AVIF, SVG…).')
      return
    }
    if (file.size > MAX_BYTES) {
      setError(`The image is too large (max ${MAX_BYTES / 1024 / 1024} MB).`)
      return
    }

    setIsLoading(true)
    const url = URL.createObjectURL(file)
    try {
      const element = new Image()
      element.src = url
      await element.decode()
      if (loadId !== loadIdRef.current) {
        URL.revokeObjectURL(url)
        return
      }
      if (!element.naturalWidth || !element.naturalHeight) throw new Error('The image has no size')
      replaceUrl(url)
      setImage({
        element,
        url,
        fileName: file.name || 'pasted-image',
        fileSize: file.size,
        mimeType: file.type,
        width: element.naturalWidth,
        height: element.naturalHeight,
      })
    } catch {
      URL.revokeObjectURL(url)
      if (loadId === loadIdRef.current) setError('This image could not be read. Your browser may not support its format.')
    } finally {
      if (loadId === loadIdRef.current) setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    loadIdRef.current++
    replaceUrl(null)
    setImage(null)
    setError(null)
    setIsLoading(false)
  }, [])

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      // Let text fields handle their own pastes.
      if (event.target instanceof Element && event.target.closest('input, textarea, [contenteditable="true"]')) return
      const file = event.clipboardData?.files[0]
      if (!file) return
      event.preventDefault()
      void load(file)
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [load])

  return { image, error, isLoading, load, clear }
}
