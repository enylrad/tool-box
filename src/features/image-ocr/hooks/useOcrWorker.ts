import { useCallback, useEffect, useRef } from 'react'
import type { ImageLike, LoggerMessage, Worker as TesseractWorker } from 'tesseract.js'
import { getSiteUrl, getTesseractAssetUrls } from '../lib/assetUrls'
import type { OcrLanguage } from '../lib/ocrLanguages'

export interface OcrResult {
  text: string
  /** Mean word confidence, 0–100. */
  confidence: number
}

type ProgressListener = (message: LoggerMessage) => void

/**
 * Runs Tesseract OCR in a Web Worker. Tesseract.js is loaded on demand and the
 * worker is created on first use, then reused (and switched to another
 * language when needed) until it is terminated or the page is closed.
 */
export function useOcrWorker() {
  const workerRef = useRef<Promise<TesseractWorker> | null>(null)
  const workerLanguageRef = useRef<OcrLanguage | null>(null)
  const progressListenerRef = useRef<ProgressListener | null>(null)

  /** Stops the worker immediately; a new one is created on the next recognition. */
  const terminate = useCallback(() => {
    const worker = workerRef.current
    workerRef.current = null
    void worker?.then((instance) => instance.terminate()).catch(() => {})
  }, [])

  useEffect(() => terminate, [terminate])

  const getWorker = useCallback(
    async (language: OcrLanguage) => {
      if (!workerRef.current) {
        workerLanguageRef.current = language
        workerRef.current = import('tesseract.js').then(({ createWorker, OEM }) =>
          createWorker(language, OEM.LSTM_ONLY, {
            ...getTesseractAssetUrls(getSiteUrl()),
            // Load the worker script directly from this site instead of through a blob URL.
            workerBlobURL: false,
            logger: (message) => progressListenerRef.current?.(message),
          }),
        )
      }
      try {
        const worker = await workerRef.current
        if (workerLanguageRef.current !== language) {
          await worker.reinitialize(language)
          workerLanguageRef.current = language
        }
        return worker
      } catch (cause) {
        // Start from scratch next time instead of reusing a broken worker.
        terminate()
        throw cause
      }
    },
    [terminate],
  )

  /** Recognizes the text in one image. Only one recognition should run at a time. */
  const recognizeImage = useCallback(
    async (image: ImageLike, language: OcrLanguage, onProgress: ProgressListener): Promise<OcrResult> => {
      progressListenerRef.current = onProgress
      try {
        const worker = await getWorker(language)
        const { data } = await worker.recognize(image)
        return { text: data.text.trim(), confidence: data.confidence }
      } finally {
        progressListenerRef.current = null
      }
    },
    [getWorker],
  )

  return { recognizeImage, terminate }
}
