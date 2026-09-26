import { useRef, useState, type DragEvent } from 'react'

interface FileDropProps {
  label: string
  hint?: string
  accept?: string
  onFile: (file: File) => void
}

/** A drop zone that also opens the file picker when clicked. */
export function FileDrop({ label, hint, accept = 'image/*', onFile }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = (event: DragEvent<HTMLButtonElement>) => {
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
        className={`flex w-full flex-col items-center justify-center rounded-lg border-2 border-dashed px-4 py-5 text-center text-sm transition-colors ${
          isDragging
            ? 'border-sky-500 bg-sky-50 dark:bg-sky-950'
            : 'border-slate-300 hover:border-slate-400 dark:border-slate-700 dark:hover:border-slate-500'
        }`}
      >
        <span className="font-medium text-slate-700 dark:text-slate-200">{label}</span>
        {hint && <span className="mt-1 text-xs text-slate-500 dark:text-slate-400">{hint}</span>}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          // Reset so choosing the same file again still triggers onChange.
          event.target.value = ''
        }}
      />
    </>
  )
}
