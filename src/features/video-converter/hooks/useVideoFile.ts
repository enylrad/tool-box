import { useCallback, useEffect, useState } from 'react'
import { parseMediaInfo } from '../lib/ffmpegLog'
import type { FfmpegEngine } from './useFfmpeg'

export interface VideoMetadata {
  duration: number | null
  width: number
  height: number
  hasVideo: boolean
}

export type PreviewState = 'loading' | 'ready' | 'unavailable'

export interface VideoFileState {
  file: File
  url: string
  metadata: VideoMetadata | null
  preview: PreviewState
}

/**
 * The selected video: its object URL (revoked when replaced) and its metadata.
 * Metadata normally comes from the <video> element; when the browser cannot
 * decode the file (AVI, some MKV), ffmpeg reads it instead.
 */
export function useVideoFile(engine: FfmpegEngine) {
  const [state, setState] = useState<VideoFileState | null>(null)
  const { withInput } = engine

  useEffect(() => {
    const url = state?.url
    return () => {
      if (url) URL.revokeObjectURL(url)
    }
  }, [state?.url])

  const selectFile = useCallback((file: File) => {
    const url = URL.createObjectURL(file)
    setState({ file, url, metadata: null, preview: 'loading' })
  }, [])

  const updateIfCurrent = useCallback((url: string, update: Partial<VideoFileState>) => {
    setState((previous) => (previous && previous.url === url ? { ...previous, ...update } : previous))
  }, [])

  const reportPreviewMetadata = useCallback(
    (url: string, video: HTMLVideoElement) => {
      const duration = Number.isFinite(video.duration) ? video.duration : null
      updateIfCurrent(url, {
        preview: 'ready',
        metadata: { duration, width: video.videoWidth, height: video.videoHeight, hasVideo: video.videoWidth > 0 },
      })
    },
    [updateIfCurrent],
  )

  const reportPreviewError = useCallback(
    (url: string, file: File) => {
      updateIfCurrent(url, { preview: 'unavailable' })
      const lines: string[] = []
      withInput(file, (ffmpeg, inputPath) => ffmpeg.exec(['-hide_banner', '-i', inputPath]), (line) => lines.push(line))
        .then(() => {
          const { duration, width, height, hasVideo } = parseMediaInfo(lines)
          updateIfCurrent(url, { metadata: { duration, width, height, hasVideo } })
        })
        .catch((cause: unknown) => console.error('Could not read the video details', cause))
    },
    [updateIfCurrent, withInput],
  )

  return { video: state, selectFile, reportPreviewMetadata, reportPreviewError }
}
