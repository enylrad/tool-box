import { OpenFileButton } from './OpenFileButton'

interface EmptyStateProps {
  isLoading: boolean
  onFile: (file: File) => void
}

export function EmptyState({ isLoading, onFile }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-10 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <path d="M3 12h2M7 8v8M11 4v16M15 7v10M19 10v4M21 12h0" />
        </svg>
        {isLoading ? (
          <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
            Decoding audio…
          </p>
        ) : (
          <>
            <div>
              <p className="font-medium">Drop an audio file here</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                MP3, WAV, FLAC, OGG, Opus, M4A/AAC, WebM — or a video to extract its audio.
              </p>
            </div>
            <OpenFileButton onFile={onFile} variant="primary" label="Choose a file" />
            <p className="text-xs text-slate-500 dark:text-slate-400">The file is processed on your device and never uploaded.</p>
          </>
        )}
      </div>
    </div>
  )
}
