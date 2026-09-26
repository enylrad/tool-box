import { useCallback, useState } from 'react'

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024

export interface LoadedImage {
  /** The file encoded as a data URL, safe to embed in exported files. */
  dataUrl: string
  /** Decoded image, ready to be drawn on a canvas. */
  element: HTMLImageElement
  fileName: string
}

function readAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

async function decodeImage(dataUrl: string): Promise<HTMLImageElement> {
  const image = new Image()
  image.src = dataUrl
  await image.decode()
  return image
}

/** Loads a user-selected image file entirely in memory (nothing is uploaded). */
export function useImageFile({ maxBytes = DEFAULT_MAX_BYTES } = {}) {
  const [image, setImage] = useState<LoadedImage | null>(null)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(
    async (file: File) => {
      setError(null)
      if (!file.type.startsWith('image/')) {
        setError('Please choose an image file (PNG, JPG, SVG, WebP…).')
        return
      }
      if (file.size > maxBytes) {
        setError(`The image is too large (max ${Math.round(maxBytes / 1024 / 1024)} MB).`)
        return
      }
      try {
        const dataUrl = await readAsDataUrl(file)
        const element = await decodeImage(dataUrl)
        setImage({ dataUrl, element, fileName: file.name })
      } catch {
        setError('This image could not be read.')
      }
    },
    [maxBytes],
  )

  /** Loads an image that is already available as a data URL (e.g. a built-in preset). */
  const loadDataUrl = useCallback(async (dataUrl: string, fileName: string) => {
    setError(null)
    try {
      setImage({ dataUrl, element: await decodeImage(dataUrl), fileName })
    } catch {
      setError('This image could not be read.')
    }
  }, [])

  const clear = useCallback(() => {
    setImage(null)
    setError(null)
  }, [])

  return { image, error, load, loadDataUrl, clear }
}
