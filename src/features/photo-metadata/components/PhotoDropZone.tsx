import { useRef, useState, type DragEvent } from 'react'
import { ImageIcon } from './Icons'

export const ACCEPTED_FILES = 'image/*,.heic,.heif,.avif,.jxl,.dng,.cr2,.cr3,.nef,.arw,.orf,.rw2,.raf,.pef,.srw'

interface PhotoDropZoneProps {
  onFile: (file: File) => void
  isLoading: boolean
}

/** Large empty-state drop target that also opens the file picker. */
export function PhotoDropZone({ onFile, isLoading }: PhotoDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        disabled={isLoading}
        className={`flex min-h-72 w-full flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed px-6 py-12 text-center transition-colors focus-visible:outline-2 focus-visible:outline-sky-600 ${
          isDragging
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950'
            : 'border-slate-300 bg-white hover:border-slate-400 dark:border-slate-700 dark:bg-slate-900 dark:hover:border-slate-500'
        }`}
      >
        <ImageIcon className="size-10 text-slate-400" />
        <span className="text-base font-medium text-slate-800 dark:text-slate-100">
          {isLoading ? 'Reading metadata…' : 'Drop a photo here or click to choose one'}
        </span>
        <span className="max-w-md text-sm text-slate-500 dark:text-slate-400">
          JPEG, PNG, WebP, HEIC, AVIF, TIFF and camera RAW files. You can also paste an image with Ctrl+V.
        </span>
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_FILES}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
    </>
  )
}
