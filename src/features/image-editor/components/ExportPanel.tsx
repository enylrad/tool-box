import { Button } from '../../../components/Button'
import { SegmentedControl } from '../../../components/form/SegmentedControl'
import { Slider } from '../../../components/form/Slider'
import { formatBytes } from '../../../lib/formatBytes'
import { OUTPUT_FORMATS, formatLabel, type OutputFormat, type OutputSettings } from '../lib/output'

interface ExportPanelProps {
  settings: OutputSettings
  formats: readonly OutputFormat[]
  /** The rendered file, or `null` until it is ready. */
  outputFile: Blob | null
  isRendering: boolean
  error: string | null
  onChange: (patch: Partial<OutputSettings>) => void
  onDownload: () => void
}

export function ExportPanel({ settings, formats, outputFile, isRendering, error, onChange, onDownload }: ExportPanelProps) {
  const format = OUTPUT_FORMATS[settings.format]

  return (
    <>
      <SegmentedControl
        label="Format"
        value={settings.format}
        options={formats.map((id) => ({ value: id, label: OUTPUT_FORMATS[id].label }))}
        onChange={(next) => onChange({ format: next })}
        hint={settings.format === 'jpeg' ? 'JPEG has no transparency: transparent areas become white.' : undefined}
      />
      {format.isLossy ? (
        <Slider
          label="Quality"
          value={settings.quality}
          min={0.1}
          max={1}
          step={0.01}
          onChange={(quality) => onChange({ quality })}
          formatValue={(value) => `${Math.round(value * 100)}%`}
        />
      ) : (
        <p className="text-xs text-slate-500 dark:text-slate-400">PNG is lossless and keeps transparency.</p>
      )}
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <Button variant="primary" className="w-full" onClick={onDownload} disabled={isRendering || !outputFile}>
        {isRendering || !outputFile
          ? 'Processing…'
          : `Download ${formatLabel(outputFile.type)} (${formatBytes(outputFile.size)})`}
      </Button>
    </>
  )
}
