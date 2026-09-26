import { useCallback, useEffect, useRef, useState } from 'react'
import { abortable } from '../lib/abortable'
import type { OcrLanguage } from '../lib/ocrLanguages'
import { describePageProgress, describeProgress, type OcrProgress } from '../lib/ocrProgress'
import { openPdf, PdfOpenError, releaseCanvas, renderPage } from '../lib/pdfDocument'
import { hasUsableText, joinPages, ocrRenderScale, textContentToString } from '../lib/pdfText'
import type { ExtractionResult } from '../lib/resultSummary'
import { isPdf } from '../lib/sourceFile'
import { useOcrWorker } from './useOcrWorker'

const GENERIC_ERROR = 'Could not read text from this file. Please try again or use another file.'

/**
 * Extracts text from an image (with OCR) or a PDF. PDF pages that contain
 * embedded text are read directly; only scanned pages go through OCR.
 */
export function useTextExtraction() {
  const { recognizeImage, terminate } = useOcrWorker()
  const [progress, setProgress] = useState<OcrProgress | null>(null)
  const [isExtracting, setIsExtracting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const extractImage = useCallback(
    async (image: File, language: OcrLanguage, signal: AbortSignal): Promise<ExtractionResult> => {
      const { text, confidence } = await abortable(
        recognizeImage(image, language, (message) => setProgress(describeProgress(message))),
        signal,
      )
      return { text, source: 'image', pageCount: 1, ocrPageCount: 1, confidence }
    },
    [recognizeImage],
  )

  const extractPdf = useCallback(
    async (file: File, language: OcrLanguage, signal: AbortSignal): Promise<ExtractionResult> => {
      setProgress({ label: 'Opening PDF…', percent: 0 })
      const pdf = await abortable(openPdf(file), signal)
      try {
        const pageCount = pdf.numPages
        const pageTexts: string[] = []
        const confidences: number[] = []
        const reportPage = (pageIndex: number, pageProgress: OcrProgress) =>
          setProgress(describePageProgress(pageProgress, pageIndex, pageCount))

        for (let pageIndex = 0; pageIndex < pageCount; pageIndex++) {
          signal.throwIfAborted()
          reportPage(pageIndex, { label: 'Reading text…', percent: 0 })
          const page = await pdf.getPage(pageIndex + 1)
          try {
            const embeddedText = textContentToString((await page.getTextContent()).items)
            if (hasUsableText(embeddedText)) {
              pageTexts.push(embeddedText)
              continue
            }
            reportPage(pageIndex, { label: 'Rendering scanned page…', percent: 0 })
            const [width, height] = [page.view[2] - page.view[0], page.view[3] - page.view[1]]
            const canvas = await abortable(renderPage(page, ocrRenderScale(width, height)), signal)
            try {
              const { text, confidence } = await abortable(
                recognizeImage(canvas, language, (message) => reportPage(pageIndex, describeProgress(message))),
                signal,
              )
              pageTexts.push(text)
              confidences.push(confidence)
            } finally {
              releaseCanvas(canvas)
            }
          } finally {
            page.cleanup()
          }
        }

        const confidence = confidences.length
          ? confidences.reduce((sum, value) => sum + value, 0) / confidences.length
          : null
        return { text: joinPages(pageTexts), source: 'pdf', pageCount, ocrPageCount: confidences.length, confidence }
      } finally {
        void pdf.loadingTask.destroy()
      }
    },
    [recognizeImage],
  )

  /** Returns null when extraction fails, is cancelled or another one is already running. */
  const extract = useCallback(
    async (file: File, language: OcrLanguage): Promise<ExtractionResult | null> => {
      if (abortControllerRef.current) return null
      const controller = new AbortController()
      abortControllerRef.current = controller
      setIsExtracting(true)
      setError(null)
      setProgress({ label: 'Loading…', percent: 0 })

      try {
        return isPdf(file)
          ? await extractPdf(file, language, controller.signal)
          : await extractImage(file, language, controller.signal)
      } catch (cause) {
        if (controller.signal.aborted) return null
        console.error('Text extraction failed', cause)
        setError(cause instanceof PdfOpenError ? cause.message : GENERIC_ERROR)
        return null
      } finally {
        abortControllerRef.current = null
        setIsExtracting(false)
        setProgress(null)
      }
    },
    [extractImage, extractPdf],
  )

  /** Stops the running extraction. The OCR worker is terminated because Tesseract cannot abort a job. */
  const cancel = useCallback(() => {
    const controller = abortControllerRef.current
    if (!controller) return
    controller.abort(new DOMException('Extraction cancelled', 'AbortError'))
    terminate()
  }, [terminate])

  useEffect(() => () => abortControllerRef.current?.abort(), [])

  return { extract, cancel, isExtracting, progress, error }
}
