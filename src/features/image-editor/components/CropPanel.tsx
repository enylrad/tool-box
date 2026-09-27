import { Button } from '../../../components/Button'
import { clampCrop, type CropRect, type Size } from '../../../lib/cropGeometry'
import { ASPECT_PRESETS } from '../lib/resize'

interface CropPanelProps {
  image: Size
  crop: CropRect
  aspectPresetId: string
  onAspectPreset: (presetId: string) => void
  onChange: (crop: CropRect) => void
  onReset: () => void
}

const FIELDS: { key: keyof CropRect; label: string }[] = [
  { key: 'x', label: 'X' },
  { key: 'y', label: 'Y' },
  { key: 'width', label: 'Width' },
  { key: 'height', label: 'Height' },
]

export function CropPanel({ image, crop, aspectPresetId, onAspectPreset, onChange, onReset }: CropPanelProps) {
  const isFullImage = crop.x === 0 && crop.y === 0 && crop.width === image.width && crop.height === image.height

  return (
    <>
      <div role="radiogroup" aria-label="Aspect ratio" className="flex flex-wrap gap-1.5">
        {ASPECT_PRESETS.map((preset) => (
          <button
            key={preset.id}
            type="button"
            role="radio"
            aria-checked={aspectPresetId === preset.id}
            onClick={() => onAspectPreset(preset.id)}
            className={`rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${
              aspectPresetId === preset.id
                ? 'bg-sky-600 text-white ring-sky-600'
                : 'text-slate-700 ring-slate-300 hover:bg-slate-100 dark:text-slate-300 dark:ring-slate-600 dark:hover:bg-slate-800'
            }`}
          >
            {preset.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-4 gap-2">
        {FIELDS.map(({ key, label }) => (
          <label key={key} className="flex flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
            {label}
            <input
              type="number"
              min={0}
              value={crop[key]}
              onChange={(event) => {
                const value = event.target.valueAsNumber
                if (Number.isFinite(value)) onChange(clampCrop({ ...crop, [key]: value }, image))
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 font-mono text-sm text-slate-900 tabular-nums dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        ))}
      </div>
      <div className="flex items-center justify-between gap-2">
        <p className="text-xs text-slate-500 dark:text-slate-400">Drag the box or its corners on the image.</p>
        <Button variant="ghost" onClick={onReset} disabled={isFullImage && aspectPresetId === 'free'}>
          Reset
        </Button>
      </div>
    </>
  )
}
