import { Button } from '../../../components/Button'
import { OCR_LANGUAGES, type OcrLanguage } from '../lib/ocrLanguages'

interface OcrToolbarProps {
  language: OcrLanguage
  onLanguageChange: (language: OcrLanguage) => void
  statusText: string
  hasImage: boolean
  hasText: boolean
  isRecognizing: boolean
  isCopied: boolean
  onRecognize: () => void
  onCopy: () => void
  onDownload: () => void
  onClear: () => void
}

export function OcrToolbar({
  language,
  onLanguageChange,
  statusText,
  hasImage,
  hasText,
  isRecognizing,
  isCopied,
  onRecognize,
  onCopy,
  onDownload,
  onClear,
}: OcrToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 flex-1 basis-56">
        <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Image to Text (OCR)</h1>
        <p className="truncate text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          {statusText}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <label className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
          <span className="sr-only sm:not-sr-only">Language</span>
          <select
            className="rounded-md bg-white px-2 py-1.5 text-sm text-slate-900 ring-1 ring-slate-300 ring-inset focus-visible:outline-2 focus-visible:outline-sky-600 disabled:opacity-60 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
            value={language}
            onChange={(event) => onLanguageChange(event.target.value as OcrLanguage)}
            disabled={isRecognizing}
          >
            {OCR_LANGUAGES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <Button variant="ghost" onClick={onClear} disabled={isRecognizing || (!hasImage && !hasText)}>
          Clear
        </Button>
        <Button onClick={onCopy} disabled={!hasText}>
          {isCopied ? 'Copied!' : 'Copy'}
        </Button>
        <Button onClick={onDownload} disabled={!hasText}>
          Download .txt
        </Button>
        <Button variant="primary" onClick={onRecognize} disabled={!hasImage || isRecognizing} aria-busy={isRecognizing}>
          {isRecognizing ? 'Extracting…' : 'Extract text'}
        </Button>
      </div>
    </div>
  )
}
