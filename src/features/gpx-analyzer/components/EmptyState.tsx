import { Button } from '../../../components/Button'
import { OpenGpxButton } from './OpenGpxButton'

interface EmptyStateProps {
  isLoading: boolean
  onFile: (file: File) => void
  onTrySample: () => void
}

export function EmptyState({ isLoading, onFile, onTrySample }: EmptyStateProps) {
  return (
    <div className="flex flex-1 items-center justify-center p-4">
      <div className="flex w-full max-w-xl flex-col items-center gap-4 rounded-xl border-2 border-dashed border-slate-300 bg-white px-6 py-12 text-center dark:border-slate-700 dark:bg-slate-900">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-10 text-sky-600 dark:text-sky-400" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M2 20l6-11 4 6 3-4 7 9z" />
          <path d="M8 9l1.5 2.5M15 11l1.2 1.6" />
        </svg>
        {isLoading ? (
          <p className="text-sm text-slate-600 dark:text-slate-300" aria-live="polite">
            Reading the route…
          </p>
        ) : (
          <>
            <div>
              <p className="font-medium">Drop a GPX file here</p>
              <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                Exported from Strava, Garmin, Komoot, Wikiloc, a GPS watch… See the route in 2D and 3D, the elevation profile, total ascent and
                descent, grades and climbs.
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <OpenGpxButton onFile={onFile} variant="primary" label="Choose a GPX file" />
              <Button variant="ghost" onClick={onTrySample}>
                Try a sample route
              </Button>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">The file is analyzed on your device and never uploaded. No map tiles are downloaded.</p>
          </>
        )}
      </div>
    </div>
  )
}
