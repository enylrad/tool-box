import { useCallback, useEffect, useRef, useState } from 'react'
import type { Worker as TesseractWorker } from 'tesseract.js'
import { getTesseractAssetUrls, type OcrLanguage } from '../lib/ocrLanguages'
import { describeProgress, type OcrProgress } from '../lib/ocrProgress'

export interface OcrResult {
  text: string
  /** Mean word confidence, 0–100. */
  confidence: number
}

/**
 * Runs Tesseract OCR in a Web Worker. Tesseract.js is loaded on demand and
 * the worker is created on first use, then reused (and switched to another
 * language when needed) until the page is closed.
 */
export function useOcrWorker() {
  const [progress, setProgress] = useState<OcrProgress | null>(null)
  const [isRecognizing, setIsRecognizing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const workerRef = useRef<Promise<TesseractWorker> | null>(null)
  const workerLanguageRef = useRef<OcrLanguage | null>(null)
  const isRunningRef = useRef(false)

  const getWorker = useCallback(async (language: OcrLanguage) => {
    if (!workerRef.current) {
      workerLanguageRef.current = language
      workerRef.current = import('tesseract.js').then(({ createWorker, OEM }) =>
        createWorker(language, OEM.LSTM_ONLY, {
          ...getTesseractAssetUrls(new URL(import.meta.env.BASE_URL, window.location.href).href),
          // Load the worker script directly from this site instead of through a blob URL.
          workerBlobURL: false,
          logger: (message) => setProgress(describeProgress(message)),
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
      const brokenWorker = workerRef.current
      workerRef.current = null
      void brokenWorker?.then((worker) => worker.terminate()).catch(() => {})
      throw cause
    }
  }, [])

  useEffect(
    () => () => {
      const worker = workerRef.current
      workerRef.current = null
      void worker?.then((instance) => instance.terminate()).catch(() => {})
    },
    [],
  )

  const recognize = useCallback(
    async (image: Blob, language: OcrLanguage): Promise<OcrResult | null> => {
      if (isRunningRef.current) return null
      isRunningRef.current = true
      setIsRecognizing(true)
      setError(null)
      setProgress({ label: 'Loading OCR engine…', percent: 0 })

      try {
        const worker = await getWorker(language)
        const { data } = await worker.recognize(image)
        return { text: data.text.trim(), confidence: data.confidence }
      } catch (cause) {
        console.error('OCR failed', cause)
        setError('Could not read text from this image. Please try again or use another image.')
        return null
      } finally {
        isRunningRef.current = false
        setIsRecognizing(false)
        setProgress(null)
      }
    },
    [getWorker],
  )

  return { recognize, isRecognizing, progress, error }
}
