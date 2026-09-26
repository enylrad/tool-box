import { useEffect, useState } from 'react'
import { SplitPane, type SplitPaneSide } from '../../components/SplitPane'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { downloadBlob } from '../../lib/download'
import { ImageDropZone } from './components/ImageDropZone'
import { OcrOutput } from './components/OcrOutput'
import { OcrToolbar } from './components/OcrToolbar'
import { useImageSource } from './hooks/useImageSource'
import { useOcrWorker, type OcrResult } from './hooks/useOcrWorker'
import { toTextFileName } from './lib/imageFile'
import { DEFAULT_OCR_LANGUAGE, isOcrLanguage, type OcrLanguage } from './lib/ocrLanguages'

const LANGUAGE_STORAGE_KEY = 'tool-box:image-ocr:language'
const COPIED_FEEDBACK_MS = 2000

export default function ImageOcrPage() {
  useDocumentTitle('Image to Text (OCR)')

  const [storedLanguage, setLanguage] = useLocalStorage<OcrLanguage>(LANGUAGE_STORAGE_KEY, DEFAULT_OCR_LANGUAGE)
  const language = isOcrLanguage(storedLanguage) ? storedLanguage : DEFAULT_OCR_LANGUAGE
  const [result, setResult] = useState<OcrResult | null>(null)
  const [text, setText] = useState('')
  const [copyError, setCopyError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [activePane, setActivePane] = useState<SplitPaneSide>('left')
  const { recognize, isRecognizing, progress, error: ocrError } = useOcrWorker()

  const extractText = async (file: File, ocrLanguage = language) => {
    setActivePane('right')
    setResult(null)
    setText('')
    const nextResult = await recognize(file, ocrLanguage)
    if (nextResult) {
      setResult(nextResult)
      setText(nextResult.text)
    }
  }

  // Text is extracted as soon as an image is chosen, dropped or pasted.
  const { image, previewUrl, error: imageError, selectFiles, clearImage } = useImageSource({
    onSelect: (file) => void extractText(file),
    disabled: isRecognizing,
  })

  useEffect(() => {
    if (!isCopied) return
    const timeoutId = window.setTimeout(() => setIsCopied(false), COPIED_FEEDBACK_MS)
    return () => window.clearTimeout(timeoutId)
  }, [isCopied])

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopyError(null)
      setIsCopied(true)
    } catch {
      setCopyError('Could not copy to the clipboard. Select the text and copy it manually.')
    }
  }

  const handleDownload = () => {
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, toTextFileName(image?.name ?? ''))
  }

  const handleLanguageChange = (nextLanguage: OcrLanguage) => {
    setLanguage(nextLanguage)
    if (image) void extractText(image, nextLanguage)
  }

  const handleClear = () => {
    setActivePane('left')
    clearImage()
    setResult(null)
    setText('')
    setCopyError(null)
  }

  const statusText = result
    ? `Done · ${Math.round(result.confidence)}% confidence`
    : image
      ? isRecognizing
        ? 'Extracting text…'
        : 'Ready to extract text'
      : 'Choose, drop or paste an image to start'

  const error = ocrError ?? copyError

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <OcrToolbar
        language={language}
        onLanguageChange={handleLanguageChange}
        statusText={statusText}
        hasImage={image !== null}
        hasText={text.length > 0}
        isRecognizing={isRecognizing}
        isCopied={isCopied}
        onRecognize={() => image && void extractText(image)}
        onCopy={() => void handleCopy()}
        onDownload={handleDownload}
        onClear={handleClear}
      />
      {error && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      <SplitPane
        leftLabel="Image"
        rightLabel="Text"
        activePane={activePane}
        onActivePaneChange={setActivePane}
        left={
          <ImageDropZone
            previewUrl={previewUrl}
            fileName={image?.name ?? null}
            error={imageError}
            disabled={isRecognizing}
            onFiles={selectFiles}
          />
        }
        right={<OcrOutput text={text} onTextChange={setText} progress={progress} hasResult={result !== null} />}
      />
    </div>
  )
}
