import { useRef, useState, type DragEvent } from 'react'
import { Button } from '../../../components/Button'
import { VIDEO_ACCEPT } from '../lib/formats'

interface FileDropZoneProps {
  onFile: (file: File) => void
}

export function FileDropZone({ onFile }: FileDropZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div className="flex flex-1 items-center justify-center overflow-auto p-4">
      <div
        onDragOver={(event) => {
          event.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`flex w-full max-w-2xl flex-col items-center gap-4 rounded-2xl border-2 border-dashed px-6 py-16 text-center transition-colors ${
          isDragging
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/40'
            : 'border-slate-300 bg-white dark:border-slate-700 dark:bg-slate-900'
        }`}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-12 text-slate-400" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <rect x="2.5" y="5" width="14" height="14" rx="2" />
          <path d="m16.5 10 5-3v10l-5-3" strokeLinejoin="round" />
        </svg>
        <div>
          <h1 className="text-lg font-semibold">Edit and convert a video</h1>
          <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
            Trim, crop, rotate or flip it, then save it as MP4, WebM, MOV, MKV, AVI, GIF, MP3 or WAV.
          </p>
        </div>
        <Button variant="primary" onClick={() => inputRef.current?.click()}>
          Choose a video
        </Button>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          or drop it here. The video is processed on your device and never uploaded.
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={VIDEO_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const file = event.target.files?.[0]
            if (file) onFile(file)
            event.target.value = ''
          }}
        />
      </div>
    </div>
  )
}
