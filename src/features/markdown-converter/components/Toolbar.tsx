import { Button } from '../../../components/Button'
import type { PersistStatus } from '../../../hooks/useLocalStorage'

interface ToolbarProps {
  title: string
  saveStatus: PersistStatus
  isExportingPdf: boolean
  onExportPdf: () => void
  onExportHtml: () => void
  onReset: () => void
}

const SAVE_STATUS_LABELS: Record<PersistStatus, string> = {
  saved: 'Saved in this browser',
  pending: 'Saving…',
  error: 'Could not save (storage unavailable)',
}

export function Toolbar({ title, saveStatus, isExportingPdf, onExportPdf, onExportHtml, onReset }: ToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 flex-1 basis-56">
        <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</h1>
        <p
          className={`text-xs ${saveStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
          aria-live="polite"
        >
          {SAVE_STATUS_LABELS[saveStatus]}
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" onClick={onReset}>
          Reset
        </Button>
        <Button onClick={onExportHtml}>Export HTML</Button>
        <Button variant="primary" onClick={onExportPdf} disabled={isExportingPdf} aria-busy={isExportingPdf}>
          {isExportingPdf ? 'Generating PDF…' : 'Export PDF'}
        </Button>
      </div>
    </div>
  )
}
