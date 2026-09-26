import { useRef, useState, type DragEvent } from 'react'
import { Button } from '../../../components/Button'
import { SUPPORTED_IMAGE_TYPES } from '../lib/imageFile'

interface ImageDropZoneProps {
  previewUrl: string | null
  fileName: string | null
  error: string | null
  disabled: boolean
  onFiles: (files: FileList | null) => void
}

export function ImageDropZone({ previewUrl, fileName, error, disabled, onFiles }: ImageDropZoneProps) {
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
        accept={SUPPORTED_IMAGE_TYPES.join(',')}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={(event) => {
          onFiles(event.target.files)
          // Allow choosing the same file again.
          event.target.value = ''
        }}
      />
      {previewUrl ? (
        <div className="flex min-h-0 flex-1 flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <p className="truncate text-sm text-slate-600 dark:text-slate-400" title={fileName ?? undefined}>
              {fileName}
            </p>
            <Button onClick={openFilePicker} disabled={disabled}>
              Choose another image
            </Button>
          </div>
          <img
            src={previewUrl}
            alt={fileName ? `Selected image: ${fileName}` : 'Selected image'}
            className="min-h-0 flex-1 rounded-lg border border-slate-200 bg-white object-contain dark:border-slate-800 dark:bg-slate-950"
          />
        </div>
      ) : (
        <div
          className={`flex flex-1 flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center ${
            isDragging ? 'border-sky-500' : 'border-slate-300 dark:border-slate-700'
          }`}
        >
          <p className="font-medium text-slate-700 dark:text-slate-200">Drop an image here</p>
          <p className="text-sm text-slate-500 dark:text-slate-400">or paste one with Ctrl+V / ⌘V</p>
          <Button variant="primary" onClick={openFilePicker} disabled={disabled}>
            Choose image
          </Button>
          <p className="text-xs text-slate-500 dark:text-slate-400">PNG, JPEG, WebP, BMP or GIF</p>
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
