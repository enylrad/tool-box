import { useState } from 'react'
import { Button } from '../../../components/Button'
import { INPUT_CLASS } from '../../../components/form/formStyles'

const PNG_SIZES = [512, 1024, 2048, 4096]

interface ExportBarProps {
  disabled: boolean
  isExportingPng: boolean
  copied: boolean
  error: string | null
  onDownloadSvg: () => void
  onDownloadPng: (sizePx: number) => void
  onCopySvg: () => void
}

export function ExportBar({ disabled, isExportingPng, copied, error, onDownloadSvg, onDownloadPng, onCopySvg }: ExportBarProps) {
  const [pngSize, setPngSize] = useState(1024)

  return (
    <div className="space-y-2">
      <Button variant="primary" className="w-full py-2" onClick={onDownloadSvg} disabled={disabled}>
        Download SVG
      </Button>
      <div className="flex gap-2">
        <select
          aria-label="PNG size"
          className={`${INPUT_CLASS} w-auto`}
          value={pngSize}
          onChange={(event) => setPngSize(Number(event.target.value))}
          disabled={disabled}
        >
          {PNG_SIZES.map((size) => (
            <option key={size} value={size}>
              {size} px
            </option>
          ))}
        </select>
        <Button className="flex-1" onClick={() => onDownloadPng(pngSize)} disabled={disabled || isExportingPng}>
          {isExportingPng ? 'Creating PNG…' : 'Download PNG'}
        </Button>
      </div>
      <Button className="w-full" onClick={onCopySvg} disabled={disabled} aria-live="polite">
        {copied ? 'Copied!' : 'Copy SVG code'}
      </Button>
      {error && (
        <p role="alert" className="text-sm text-red-600 dark:text-red-400">
          {error}
        </p>
      )}
    </div>
  )
}
