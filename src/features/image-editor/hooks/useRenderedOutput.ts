import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import type { CropRect, Size } from '../../../lib/cropGeometry'
import type { OutputSettings } from '../lib/output'
import { renderImage } from '../lib/render'
import type { WatermarkSettings } from '../lib/watermark'

const RENDER_DELAY_MS = 250

export interface RenderedOutput {
  blob: Blob
  /** Object URL of `blob`, for the "after" preview. */
  url: string
  width: number
  height: number
}

interface RenderRequest {
  image: HTMLImageElement
  crop: CropRect
  size: Size
  watermark: WatermarkSettings
  output: OutputSettings
}

/**
 * Renders and encodes the final image shortly after the settings stop changing.
 * The same blob is previewed, measured and downloaded, so the size shown is
 * exactly the size of the file you get.
 */
export function useRenderedOutput(request: RenderRequest | null) {
  const debouncedRequest = useDebouncedValue(request, RENDER_DELAY_MS)
  const [result, setResult] = useState<{ request: RenderRequest; output: RenderedOutput } | null>(null)
  const [error, setError] = useState<{ request: RenderRequest; message: string } | null>(null)

  useEffect(() => {
    if (!debouncedRequest) return
    let isCurrent = true
    const { image, ...options } = debouncedRequest
    renderImage(image, options)
      .then((blob) => {
        if (!isCurrent) return
        const url = URL.createObjectURL(blob)
        setResult({ request: debouncedRequest, output: { blob, url, width: options.size.width, height: options.size.height } })
        setError(null)
      })
      .catch((renderError: unknown) => {
        console.error('Image rendering failed', renderError)
        if (isCurrent) setError({ request: debouncedRequest, message: 'The image could not be processed. Try a smaller output size.' })
      })
    return () => {
      isCurrent = false
    }
  }, [debouncedRequest])

  // Each result's URL is released once a newer result replaces it.
  useEffect(() => {
    const url = result?.output.url
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [result])

  const isRendering = request !== null && result?.request !== request && error?.request !== request
  const output = useMemo(() => (request && result?.request.image === request.image ? result.output : null), [request, result])

  return { output, isRendering, error: error?.request === request ? error.message : null }
}
