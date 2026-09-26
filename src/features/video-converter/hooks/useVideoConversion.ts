import { useCallback, useEffect, useRef, useState } from 'react'
import { toFileName } from '../../../lib/download'
import { buildFfmpegArgs } from '../lib/buildFfmpegArgs'
import type { Transform } from '../lib/cropGeometry'
import { parseProgressTime, progressFraction } from '../lib/ffmpegLog'
import type { OutputFormat } from '../lib/formats'
import { trimmedDuration, type TrimRange } from '../lib/timecode'
import { ignoreErrors, type FfmpegEngine } from './useFfmpeg'

export interface ConversionRequest {
  file: File
  format: OutputFormat
  trim: TrimRange
  transform: Transform
  duration: number | null
}

export interface ConversionResult {
  blob: Blob
  url: string
  fileName: string
}

export type ConversionState =
  | { status: 'idle' }
  | { status: 'running'; progress: number | null }
  | { status: 'done'; result: ConversionResult }
  | { status: 'error'; message: string }

const LOG_TAIL_LENGTH = 40

function baseName(fileName: string) {
  return fileName.replace(/\.[^.]+$/, '')
}

/** Turns the end of the ffmpeg log into a message a person can act on. */
function describeFailure(logTail: string[], format: OutputFormat): string {
  const log = logTail.join('\n')
  if (format.kind === 'audio' && /matches no streams/.test(log)) return 'This video has no audio track to extract.'
  if (/Invalid data found|could not find codec parameters/i.test(log)) return 'This file is not a video that ffmpeg can read.'
  if (/memory|OOM|Aborted\(\)/i.test(log)) return 'The browser ran out of memory. Try a shorter clip or a smaller file.'
  const lastError = [...logTail].reverse().find((line) => /error|invalid|failed/i.test(line))
  return `The conversion failed${lastError ? `: ${lastError.trim()}` : '.'}`
}

/** Runs one export at a time and keeps the resulting file until it is replaced. */
export function useVideoConversion(engine: FfmpegEngine) {
  const [state, setState] = useState<ConversionState>({ status: 'idle' })
  const { withInput, cancel: cancelEngine } = engine
  const runIdRef = useRef(0)
  const resultUrl = state.status === 'done' ? state.result.url : null

  useEffect(() => {
    if (!resultUrl) return
    return () => URL.revokeObjectURL(resultUrl)
  }, [resultUrl])

  const convert = useCallback(
    async ({ file, format, trim, transform, duration }: ConversionRequest) => {
      const runId = ++runIdRef.current
      const isCurrent = () => runIdRef.current === runId
      const expectedSeconds = trimmedDuration(trim, duration)
      const outputPath = `/output-${runId}.${format.extension}`
      const logTail: string[] = []
      setState({ status: 'running', progress: expectedSeconds === null ? null : 0 })

      const handleLog = (line: string) => {
        logTail.push(line)
        if (logTail.length > LOG_TAIL_LENGTH) logTail.shift()
        const encoded = parseProgressTime(line)
        if (encoded !== null && isCurrent()) {
          setState({ status: 'running', progress: progressFraction(encoded, expectedSeconds) })
        }
      }

      try {
        const data = await withInput(
          file,
          async (ffmpeg, inputPath) => {
            const args = buildFfmpegArgs({ inputPath, outputPath, format, trim, transform, duration })
            try {
              const exitCode = await ffmpeg.exec(args)
              if (exitCode !== 0) throw new Error(describeFailure(logTail, format))
              return await ffmpeg.readFile(outputPath)
            } finally {
              await ignoreErrors(() => ffmpeg.deleteFile(outputPath))
            }
          },
          handleLog,
        )
        if (!isCurrent()) return
        if (typeof data === 'string') throw new Error('The conversion produced no file.')
        const blob = new Blob([data as Uint8Array<ArrayBuffer>], { type: format.mimeType })
        const fileName = toFileName(`${baseName(file.name)} edited`, format.extension, 'video')
        setState({ status: 'done', result: { blob, url: URL.createObjectURL(blob), fileName } })
      } catch (cause) {
        if (!isCurrent()) return
        console.error('Video conversion failed', cause, logTail)
        const message = cause instanceof Error && cause.message ? cause.message : describeFailure(logTail, format)
        setState({ status: 'error', message })
      }
    },
    [withInput],
  )

  const cancel = useCallback(() => {
    runIdRef.current++
    cancelEngine()
    setState({ status: 'idle' })
  }, [cancelEngine])

  const reset = useCallback(() => {
    runIdRef.current++
    setState({ status: 'idle' })
  }, [])

  return { state, convert, cancel, reset }
}
