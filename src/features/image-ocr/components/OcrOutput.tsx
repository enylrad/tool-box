import type { OcrProgress } from '../lib/ocrProgress'

interface OcrOutputProps {
  text: string
  onTextChange: (text: string) => void
  progress: OcrProgress | null
  hasResult: boolean
}

export function OcrOutput({ text, onTextChange, progress, hasResult }: OcrOutputProps) {
  if (progress) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-white p-6 dark:bg-slate-950">
        <p className="text-sm text-slate-600 dark:text-slate-300">{progress.label}</p>
        <div
          role="progressbar"
          aria-label={progress.label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={progress.percent}
          className="h-2 w-full max-w-xs overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        >
          <div className="h-full bg-sky-600 transition-[width]" style={{ width: `${progress.percent}%` }} />
        </div>
        <p className="text-xs text-slate-500 tabular-nums dark:text-slate-400">{progress.percent}%</p>
      </div>
    )
  }

  if (!hasResult) {
    return (
      <div className="flex flex-1 items-center justify-center bg-white p-6 text-center text-sm text-slate-500 dark:bg-slate-950 dark:text-slate-400">
        The extracted text will appear here. You can edit it before copying or downloading.
      </div>
    )
  }

  return (
    <textarea
      aria-label="Extracted text"
      className="h-full w-full flex-1 resize-none bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 outline-none dark:bg-slate-950 dark:text-slate-100"
      value={text}
      onChange={(event) => onTextChange(event.target.value)}
      placeholder="No text was found in this image."
    />
  )
}
