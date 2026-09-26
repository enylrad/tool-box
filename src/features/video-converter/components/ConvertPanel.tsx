import { Button } from '../../../components/Button'
import { downloadBlob } from '../../../lib/download'
import type { EngineStatus } from '../hooks/useFfmpeg'
import type { ConversionState } from '../hooks/useVideoConversion'
import { formatBytes } from '../lib/formatBytes'

interface ConvertPanelProps {
  engineStatus: EngineStatus
  state: ConversionState
  formatLabel: string
  largeFileWarning: boolean
  onConvert: () => void
  onCancel: () => void
  onRetryEngine: () => void
}

export function ConvertPanel({
  engineStatus,
  state,
  formatLabel,
  largeFileWarning,
  onConvert,
  onCancel,
  onRetryEngine,
}: ConvertPanelProps) {
  if (engineStatus === 'error') {
    return (
      <div role="alert" className="flex flex-col gap-2 text-sm text-red-700 dark:text-red-300">
        <p>The video engine could not be loaded. Check your connection (it is only downloaded the first time).</p>
        <Button onClick={onRetryEngine}>Try again</Button>
      </div>
    )
  }

  if (state.status === 'running') {
    const percent = state.progress === null ? null : Math.round(state.progress * 100)
    return (
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between text-sm">
          <span aria-live="polite">Converting to {formatLabel}…</span>
          {percent !== null && <span className="font-mono tabular-nums">{percent}%</span>}
        </div>
        <div
          role="progressbar"
          aria-label="Conversion progress"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={percent ?? undefined}
          className="h-2 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-800"
        >
          <div
            className={`h-full rounded-full bg-sky-600 transition-[width] ${percent === null ? 'w-1/3 animate-pulse' : ''}`}
            style={percent === null ? undefined : { width: `${percent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Everything runs on this device, so long videos can take a while. Keep this tab open.
        </p>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    )
  }

  const isEngineLoading = engineStatus === 'loading'

  return (
    <div className="flex flex-col gap-3">
      {state.status === 'done' && (
        <div className="flex flex-col gap-2 rounded-lg bg-emerald-50 p-3 text-sm dark:bg-emerald-950/50">
          <p className="font-medium text-emerald-800 dark:text-emerald-300">
            Ready: {state.result.fileName} ({formatBytes(state.result.blob.size)})
          </p>
          <Button variant="primary" onClick={() => downloadBlob(state.result.blob, state.result.fileName)}>
            Download
          </Button>
        </div>
      )}
      {state.status === 'error' && (
        <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {state.message}
        </p>
      )}
      {largeFileWarning && (
        <p className="text-xs text-amber-700 dark:text-amber-400">
          This is a large file. Browsers have limited memory, so the conversion may fail — trimming it first helps.
        </p>
      )}
      <Button
        variant={state.status === 'done' ? 'secondary' : 'primary'}
        onClick={onConvert}
        disabled={isEngineLoading}
        aria-busy={isEngineLoading}
      >
        {isEngineLoading ? 'Loading video engine…' : state.status === 'done' ? `Convert again to ${formatLabel}` : `Convert to ${formatLabel}`}
      </Button>
      {isEngineLoading && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          The engine (about 30 MB) is downloaded once and then works offline.
        </p>
      )}
    </div>
  )
}
