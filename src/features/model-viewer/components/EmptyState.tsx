import { OpenFilesButton } from './OpenFilesButton'

interface EmptyStateProps {
  isLoading: boolean
  onFiles: (files: File[]) => void
}

export function EmptyState({ isLoading, onFiles }: EmptyStateProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center p-4">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-white/90 px-6 py-12 text-center backdrop-blur dark:border-slate-700 dark:bg-slate-900/90">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-10 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round">
          <path d="M12 2.5 20.5 7v10L12 21.5 3.5 17V7z" />
          <path d="M3.5 7 12 11.5 20.5 7M12 11.5v10" />
        </svg>
        {isLoading ? (
          <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
            Loading model…
          </p>
        ) : (
          <>
            <div>
              <p className="font-medium">Drop a 3D model here</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                OBJ, glTF or GLB. Drop its .mtl, .bin and texture files together with it to see materials and textures.
              </p>
            </div>
            <OpenFilesButton onFiles={onFiles} variant="primary" label="Choose files" />
            <p className="text-xs text-slate-500 dark:text-slate-400">The files are opened on your device and never uploaded.</p>
          </>
        )}
      </div>
    </div>
  )
}
