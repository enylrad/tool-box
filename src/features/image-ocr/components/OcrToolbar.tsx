import { Button } from '../../../components/Button'
import { OCR_LANGUAGES, type OcrLanguage } from '../lib/ocrLanguages'

interface OcrToolbarProps {
  language: OcrLanguage
  onLanguageChange: (language: OcrLanguage) => void
  statusText: string
  hasFile: boolean
  hasText: boolean
  isExtracting: boolean
  isCopied: boolean
  onExtract: () => void
  onCancel: () => void
  onCopy: () => void
  onDownload: () => void
  onClear: () => void
}

export function OcrToolbar({
  language,
  onLanguageChange,
  statusText,
  hasFile,
  hasText,
  isExtracting,
  isCopied,
  onExtract,
  onCancel,
  onCopy,
  onDownload,
  onClear,
}: OcrToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 flex-1 basis-56">
        <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Image &amp; PDF to Text (OCR)</h1>
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
            disabled={isExtracting}
          >
            {OCR_LANGUAGES.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        {isExtracting ? (
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        ) : (
          <Button variant="ghost" onClick={onClear} disabled={!hasFile && !hasText}>
            Clear
          </Button>
        )}
        <Button onClick={onCopy} disabled={!hasText}>
          {isCopied ? 'Copied!' : 'Copy'}
        </Button>
        <Button onClick={onDownload} disabled={!hasText}>
          Download .txt
        </Button>
        <Button variant="primary" onClick={onExtract} disabled={!hasFile || isExtracting} aria-busy={isExtracting}>
          {isExtracting ? 'Extracting…' : 'Extract text'}
        </Button>
      </div>
    </div>
  )
}
