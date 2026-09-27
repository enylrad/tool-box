import { Button } from '../../../components/Button'
import { FileDrop } from '../../../components/form/FileDrop'
import type { LoadedImage } from '../../../hooks/useImageFile'

interface SourcePanelProps {
  image: LoadedImage | null
  error: string | null
  warning: string | null
  isVector: boolean
  onFile: (file: File) => void
  onRemove: () => void
}

export function SourcePanel({ image, error, warning, isVector, onFile, onRemove }: SourcePanelProps) {
  return (
    <>
      {image ? (
        <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
          <img src={image.dataUrl} alt="" className="size-14 shrink-0 rounded bg-white object-contain p-1" />
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-slate-700 dark:text-slate-200">{image.fileName}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {isVector ? 'Vector image (SVG), sharp at every size' : `${image.element.naturalWidth}×${image.element.naturalHeight} px`}
            </p>
          </div>
          <Button variant="ghost" onClick={onRemove}>
            Remove
          </Button>
        </div>
      ) : (
        <FileDrop
          label="Choose or drop an image"
          hint="Square PNG or SVG, at least 1024×1024 px · stays on your device"
          onFile={onFile}
        />
      )}
      {warning && <p className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">⚠ {warning}</p>}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </>
  )
}
