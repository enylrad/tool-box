import { useRef, useState, type DragEvent } from 'react'
import { Button } from '../../../components/Button'
import { SUPPORTED_FILE_TYPES } from '../lib/sourceFile'

interface SourceDropZoneProps {
  fileName: string | null
  /** Image (or rendered first PDF page) to preview. */
  previewUrl: string | null
  isPdf: boolean
  pageCount: number | null
  isPreviewLoading: boolean
  error: string | null
  disabled: boolean
  onFiles: (files: FileList | null) => void
}

export function SourceDropZone({
  fileName,
  previewUrl,
  isPdf,
  pageCount,
  isPreviewLoading,
  error,
  disabled,
  onFiles,
}: SourceDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (event: DragEvent) => {
    event.preventDefault()
    if (!disabled) setIsDragging(true)
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    if (!disabled) onFiles(event.dataTransfer.files)
  }

  const openFilePicker = () => inputRef.current?.click()

  const details = isPdf && pageCount !== null ? `PDF · ${pageCount} ${pageCount === 1 ? 'page' : 'pages'}` : null

  return (
    <div
      className={`relative flex min-h-0 flex-1 flex-col bg-slate-100 p-4 transition-colors dark:bg-slate-900/50 ${
        isDragging ? 'bg-sky-50 dark:bg-sky-950/40' : ''
      }`}
      onDragOver={handleDragOver}
      onDragLeave={() => setIsDragging(false)}
      onDrop={handleDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={SUPPORTED_FILE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          onFiles(event.target.files)
          // Allow choosing the same file again.
          event.target.value = ''
        }}
      />
      {fileName ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="truncate text-sm text-slate-600 dark:text-slate-400" title={fileName}>
                {fileName}
              </p>
              {details && <p className="text-xs text-slate-500 dark:text-slate-400">{details}</p>}
            </div>
            <Button onClick={openFilePicker} disabled={disabled}>
              Choose another file
            </Button>
          </div>
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={isPdf ? `First page of ${fileName}` : `Selected image: ${fileName}`}
              className="min-h-0 flex-1 rounded-lg border border-slate-200 bg-white object-contain dark:border-slate-800 dark:bg-slate-950"
            />
          ) : (
            <div className="flex flex-1 items-center justify-center rounded-lg border border-slate-200 bg-white text-sm text-slate-500 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-400">
              {isPreviewLoading ? 'Loading preview…' : 'Preview not available'}
            </div>
          )}
        </div>
      ) : (
        <div
          className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center ${
            isDragging ? 'border-sky-500' : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          <p className="font-medium text-slate-700 dark:text-slate-200">Drop an image or PDF here</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">or paste one with Ctrl+V / ⌘V</p>
          <Button variant="primary" onClick={openFilePicker} disabled={disabled}>
            Choose file
          </Button>
          <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPEG, WebP, BMP, GIF or PDF</p>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
