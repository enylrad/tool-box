import { Button } from '../../../components/Button'
import { formatBytes } from '../../../lib/formatBytes'

interface ExportBarProps {
  fileCount: number
  totalBytes: number
  disabled: boolean
  isRendering: boolean
  error: string | null
  onDownloadZip: () => void
}

export function ExportBar({ fileCount, totalBytes, disabled, isRendering, error, onDownloadZip }: ExportBarProps) {
  return (
    <div className="space-y-2">
      <Button variant="primary" className="w-full py-2" onClick={onDownloadZip} disabled={disabled}>
        {isRendering ? 'Generating icons…' : 'Download ZIP'}
      </Button>
      {fileCount > 0 && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          {fileCount} files · {formatBytes(totalBytes)} · click any icon below to download it alone
        </p>
      )}
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
