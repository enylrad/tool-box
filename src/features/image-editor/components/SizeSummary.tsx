import type { Size } from '../../../lib/cropGeometry'
import { formatBytes } from '../../../lib/formatBytes'
import type { SourceImage } from '../hooks/useSourceImage'
import { formatLabel, sizeChange } from '../lib/output'

interface SizeSummaryProps {
  image: SourceImage
  outputSize: Size
  output: Blob | null
  isRendering: boolean
}

function Side({ title, dimensions, details }: { title: string; dimensions: string; details: string }) {
  return (
    <div className="min-w-0">
      <p className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</p>
      <p className="truncate text-sm tabular-nums">
        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">{dimensions}</span>
        <span className="text-slate-600 dark:text-slate-300"> · {details}</span>
      </p>
    </div>
  )
}

/** Dimensions, file size and format before and after editing. */
export function SizeSummary({ image, outputSize, output, isRendering }: SizeSummaryProps) {
  const change = output ? sizeChange(image.fileSize, output.size) : ''
  const isSmaller = output !== null && output.size < image.fileSize

  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2" aria-live="polite">
      <Side
        title="Before"
        dimensions={`${image.width}×${image.height}`}
        details={`${formatBytes(image.fileSize)} · ${formatLabel(image.mimeType)}`}
      />
      <span aria-hidden="true" className="text-slate-400">
        →
      </span>
      <Side
        title="After"
        dimensions={`${outputSize.width}×${outputSize.height}`}
        details={output && !isRendering ? `${formatBytes(output.size)} · ${formatLabel(output.type)}` : 'processing…'}
      />
      {change && !isRendering && (
        <span
          className={`rounded-full px-2 py-0.5 text-xs font-semibold tabular-nums ${
            isSmaller
              ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
          }`}
        >
          {change}
        </span>
      )}
    </div>
  )
}
