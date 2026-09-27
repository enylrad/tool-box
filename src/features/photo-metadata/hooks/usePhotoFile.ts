import { useCallback, useEffect, useRef, useState } from 'react'
import type { Dimensions } from '../lib/basicInfo'
import { detectC2pa, type C2paInfo } from '../lib/c2pa'
import { detectFormat, type ImageFormat } from '../lib/detectFormat'
import { readTags, type MetadataTags } from '../lib/tags'

const MAX_BYTES = 300 * 1024 * 1024

export interface LoadedPhoto {
  file: File
  bytes: Uint8Array
  tags: MetadataTags
  format: ImageFormat | null
  /** Hex SHA-256 of the whole file, or null where Web Crypto is unavailable (non-HTTPS pages). */
  sha256: string | null
  c2pa: C2paInfo
  /** Object URL of the photo itself or, when the browser cannot display it (HEIC, RAW), of its embedded thumbnail. */
  previewUrl: string | null
  previewIsThumbnail: boolean
  /** Size of the decoded image, when the browser could display it. */
  decoded: Dimensions | null
}

async function sha256Hex(buffer: ArrayBuffer) {
  if (!globalThis.crypto?.subtle) return null
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function decodeImage(url: string) {
  const image = new Image()
  image.src = url
  await image.decode()
  return { width: image.naturalWidth, height: image.naturalHeight }
}

async function createPreview(file: File, tags: MetadataTags) {
  const url = URL.createObjectURL(file)
  try {
    return { previewUrl: url, previewIsThumbnail: false, decoded: await decodeImage(url) }
  } catch {
    URL.revokeObjectURL(url)
  }
  const thumbnail = tags.Thumbnail?.image
  if (thumbnail) {
    const thumbnailUrl = URL.createObjectURL(new Blob([new Uint8Array(thumbnail as ArrayBuffer)], { type: 'image/jpeg' }))
    try {
      await decodeImage(thumbnailUrl)
      return { previewUrl: thumbnailUrl, previewIsThumbnail: true, decoded: null }
    } catch {
      URL.revokeObjectURL(thumbnailUrl)
    }
  }
  return { previewUrl: null, previewIsThumbnail: false, decoded: null }
}

/** Reads a photo and all of its metadata in memory. Nothing is uploaded. */
export function usePhotoFile() {
  const [photo, setPhoto] = useState<LoadedPhoto | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  // Ignores results from a file that was replaced while it was still loading.
  const requestIdRef = useRef(0)

  const previewUrl = photo?.previewUrl
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
    }
  }, [previewUrl])

  const load = useCallback(async (file: File) => {
    const requestId = ++requestIdRef.current
    setError(null)
    if (file.size > MAX_BYTES) {
      setError(`This file is too large (max ${MAX_BYTES / 1024 / 1024} MB).`)
      return
    }
    setIsLoading(true)
    try {
      const buffer = await file.arrayBuffer()
      const bytes = new Uint8Array(buffer)
      const format = detectFormat(bytes)
      if (!format && !file.type.startsWith('image/')) {
        throw new Error('This file does not look like an image.')
      }
      const [tags, sha256] = await Promise.all([readTags(buffer), sha256Hex(buffer)])
      const preview = await createPreview(file, tags)
      if (requestId !== requestIdRef.current) {
        if (preview.previewUrl) URL.revokeObjectURL(preview.previewUrl)
        return
      }
      setPhoto({ file, bytes, tags, format, sha256, c2pa: detectC2pa(bytes), ...preview })
    } catch (loadError) {
      if (requestId !== requestIdRef.current) return
      const message = loadError instanceof Error ? loadError.message : ''
      setError(message.startsWith('This file') ? message : 'The metadata of this file could not be read. It may be damaged.')
    } finally {
      if (requestId === requestIdRef.current) setIsLoading(false)
    }
  }, [])

  const clear = useCallback(() => {
    requestIdRef.current++
    setPhoto(null)
    setError(null)
    setIsLoading(false)
  }, [])

  return { photo, error, isLoading, load, clear }
}
