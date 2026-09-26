import { FFFSType, FFmpeg } from '@ffmpeg/ffmpeg'
import coreURL from '@ffmpeg/core?url'
import wasmURL from '@ffmpeg/core/wasm?url'
import { useCallback, useEffect, useRef, useState } from 'react'

export type EngineStatus = 'loading' | 'ready' | 'error'

export type LogListener = (line: string) => void

/** Runs a cleanup step that may fail because the worker was terminated. */
export async function ignoreErrors(step: () => Promise<unknown>) {
  try {
    await step()
  } catch {
    // Nothing to clean up in a terminated or failed engine.
  }
}

/**
 * Owns the ffmpeg.wasm engine, which runs in its own Web Worker.
 *
 * The single-threaded core is used because GitHub Pages cannot send the
 * COOP/COEP headers that the multi-threaded build needs. Both files are bundled
 * with the site (no CDN), so everything, including the video, stays on the device.
 */
export function useFfmpeg() {
  const [status, setStatus] = useState<EngineStatus>('loading')
  const loadingRef = useRef<{ ffmpeg: FFmpeg; promise: Promise<FFmpeg> } | null>(null)
  const logListenerRef = useRef<LogListener | null>(null)
  const mountCountRef = useRef(0)

  const load = useCallback((): Promise<FFmpeg> => {
    if (loadingRef.current) return loadingRef.current.promise

    const ffmpeg = new FFmpeg()
    ffmpeg.on('log', ({ message }) => logListenerRef.current?.(message))
    const promise = ffmpeg.load({ coreURL, wasmURL }).then(
      () => {
        if (loadingRef.current?.ffmpeg === ffmpeg) setStatus('ready')
        return ffmpeg
      },
      (cause: unknown) => {
        if (loadingRef.current?.ffmpeg === ffmpeg) {
          loadingRef.current = null
          setStatus('error')
        }
        ffmpeg.terminate()
        throw cause
      },
    )
    loadingRef.current = { ffmpeg, promise }
    return promise
  }, [])

  /** Stops the engine immediately (the only way to cancel a running command). */
  const terminate = useCallback(() => {
    loadingRef.current?.ffmpeg.terminate()
    loadingRef.current = null
    logListenerRef.current = null
  }, [])

  useEffect(() => {
    load().catch((cause: unknown) => console.error('Could not load ffmpeg', cause))
    return terminate
  }, [load, terminate])

  const retry = useCallback(() => {
    setStatus('loading')
    load().catch((cause: unknown) => console.error('Could not load ffmpeg', cause))
  }, [load])

  /** Cancels the running command and starts a fresh engine for the next one. */
  const cancel = useCallback(() => {
    terminate()
    setStatus('loading')
    load().catch((cause: unknown) => console.error('Could not load ffmpeg', cause))
  }, [load, terminate])

  /**
   * Makes `file` readable by ffmpeg without copying it into memory (WORKERFS
   * reads it lazily from the browser), runs `task`, then cleans up.
   */
  const withInput = useCallback(
    async <T>(file: File, task: (ffmpeg: FFmpeg, inputPath: string) => Promise<T>, onLog?: LogListener): Promise<T> => {
      const ffmpeg = await load()
      const mountPoint = `/input-${++mountCountRef.current}`
      await ffmpeg.createDir(mountPoint)
      await ffmpeg.mount(FFFSType.WORKERFS, { files: [file] }, mountPoint)
      logListenerRef.current = onLog ?? null
      try {
        return await task(ffmpeg, `${mountPoint}/${file.name}`)
      } finally {
        if (logListenerRef.current === (onLog ?? null)) logListenerRef.current = null
        await ignoreErrors(() => ffmpeg.unmount(mountPoint))
        await ignoreErrors(() => ffmpeg.deleteDir(mountPoint))
      }
    },
    [load],
  )

  return { status, retry, cancel, withInput }
}

export type FfmpegEngine = ReturnType<typeof useFfmpeg>
