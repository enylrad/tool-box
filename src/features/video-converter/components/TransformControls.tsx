import type { ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { clampCrop, type CropRect, type Size, type Transform } from '../lib/cropGeometry'
import { ASPECT_PRESETS } from '../hooks/useEditSettings'

interface TransformControlsProps {
  transform: Transform
  onRotate: (degrees: 90 | -90) => void
  onToggleFlip: (axis: 'horizontal' | 'vertical') => void
}

function ToggleButton({ pressed, onClick, children }: { pressed: boolean; onClick: () => void; children: ReactNode }) {
  return (
    <Button
      aria-pressed={pressed}
      onClick={onClick}
      className={pressed ? 'bg-sky-50 text-sky-700 ring-sky-400 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-600' : ''}
    >
      {children}
    </Button>
  )
}

export function RotateFlipControls({ transform, onRotate, onToggleFlip }: TransformControlsProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-2 gap-2">
        <Button onClick={() => onRotate(-90)} title="Rotate 90° counter-clockwise">
          <span aria-hidden="true">↺</span> Rotate left
        </Button>
        <Button onClick={() => onRotate(90)} title="Rotate 90° clockwise">
          <span aria-hidden="true">↻</span> Rotate right
        </Button>
        <ToggleButton pressed={transform.flipHorizontal} onClick={() => onToggleFlip('horizontal')}>
          <span aria-hidden="true">⇋</span> Mirror
        </ToggleButton>
        <ToggleButton pressed={transform.flipVertical} onClick={() => onToggleFlip('vertical')}>
          <span aria-hidden="true">⇵</span> Flip vertical
        </ToggleButton>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">Rotation: {transform.rotation}°</p>
    </div>
  )
}

interface CropControlsProps {
  frame: Size
  crop: CropRect | null
  isEditing: boolean
  aspectPresetId: string
  onStart: () => void
  onRemove: () => void
  onEditingChange: (isEditing: boolean) => void
  onAspectPreset: (presetId: string) => void
  onChange: (crop: CropRect) => void
}

const FIELDS: { key: keyof CropRect; label: string }[] = [
  { key: 'x', label: 'X' },
  { key: 'y', label: 'Y' },
  { key: 'width', label: 'Width' },
  { key: 'height', label: 'Height' },
]

export function CropControls({
  frame,
  crop,
  isEditing,
  aspectPresetId,
  onStart,
  onRemove,
  onEditingChange,
  onAspectPreset,
  onChange,
}: CropControlsProps) {
  if (!crop) {
    return (
      <Button onClick={onStart} className="w-full">
        Crop the frame…
      </Button>
    )
  }

  return (
    <div className="flex flex-col gap-3">
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
                if (Number.isFinite(value)) onChange(clampCrop({ ...crop, [key]: value }, frame))
              }}
              className="w-full rounded-md border border-slate-300 bg-white px-1.5 py-1 font-mono text-sm text-slate-900 tabular-nums dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
            />
          </label>
        ))}
      </div>
      <div className="flex gap-2">
        {isEditing ? (
          <Button variant="primary" className="flex-1" onClick={() => onEditingChange(false)}>
            Done
          </Button>
        ) : (
          <Button className="flex-1" onClick={() => onEditingChange(true)}>
            Adjust crop
          </Button>
        )}
        <Button variant="ghost" onClick={onRemove}>
          Remove crop
        </Button>
      </div>
      {isEditing && (
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Drag the box or its corners on the video. Press Done to preview the result.
        </p>
      )}
    </div>
  )
}
