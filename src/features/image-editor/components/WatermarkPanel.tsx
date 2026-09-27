import { ColorInput } from '../../../components/form/ColorInput'
import { Slider } from '../../../components/form/Slider'
import { TextInput } from '../../../components/form/TextInput'
import { Toggle } from '../../../components/form/Toggle'
import { GRID_POSITIONS, type WatermarkPosition, type WatermarkSettings } from '../lib/watermark'

interface WatermarkPanelProps {
  settings: WatermarkSettings
  onChange: (patch: Partial<WatermarkSettings>) => void
}

const POSITION_LABELS: Record<WatermarkPosition, string> = {
  'top-left': 'Top left',
  top: 'Top',
  'top-right': 'Top right',
  left: 'Left',
  center: 'Center',
  right: 'Right',
  'bottom-left': 'Bottom left',
  bottom: 'Bottom',
  'bottom-right': 'Bottom right',
  tiled: 'Tiled',
}

const percent = (value: number) => `${Math.round(value * 100)}%`

function positionButtonClass(isActive: boolean) {
  return `flex items-center justify-center rounded-md ring-1 ring-inset transition-colors ${
    isActive
      ? 'bg-sky-600 text-white ring-sky-600'
      : 'text-slate-400 ring-slate-300 hover:bg-slate-100 hover:text-slate-600 dark:ring-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-300'
  }`
}

export function WatermarkPanel({ settings, onChange }: WatermarkPanelProps) {
  return (
    <>
      <Toggle label="Add a text watermark" checked={settings.enabled} onChange={(enabled) => onChange({ enabled })} />

      {settings.enabled && (
        <>
          <TextInput label="Text" value={settings.text} maxLength={200} onChange={(text) => onChange({ text })} />
          <ColorInput label="Color" value={settings.color} onChange={(color) => onChange({ color })} />
          <Slider
            label="Opacity"
            value={settings.opacity}
            min={0.05}
            max={1}
            step={0.05}
            onChange={(opacity) => onChange({ opacity })}
            formatValue={percent}
          />
          <Slider
            label="Size"
            hint="Relative to the shorter side of the image."
            value={settings.sizePercent}
            min={1}
            max={30}
            step={0.5}
            onChange={(sizePercent) => onChange({ sizePercent })}
            formatValue={(value) => `${value}%`}
          />

          <fieldset className="space-y-1">
            <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">
              Position: {POSITION_LABELS[settings.position]}
            </legend>
            <div className="flex items-stretch gap-2">
              <div role="radiogroup" aria-label="Position" className="grid size-24 shrink-0 grid-cols-3 gap-1">
                {GRID_POSITIONS.map((position) => (
                  <button
                    key={position}
                    type="button"
                    role="radio"
                    aria-checked={settings.position === position}
                    aria-label={POSITION_LABELS[position]}
                    title={POSITION_LABELS[position]}
                    onClick={() => onChange({ position })}
                    className={positionButtonClass(settings.position === position)}
                  >
                    <span aria-hidden="true" className="size-1.5 rounded-full bg-current" />
                  </button>
                ))}
              </div>
              <button
                type="button"
                aria-pressed={settings.position === 'tiled'}
                onClick={() => onChange({ position: 'tiled' })}
                className={`${positionButtonClass(settings.position === 'tiled')} flex-1 flex-col gap-1 text-xs font-medium`}
              >
                <span aria-hidden="true" className="text-base leading-none">
                  ⁘
                </span>
                Tiled
                <span className="font-normal opacity-80">Repeat across the image</span>
              </button>
            </div>
          </fieldset>

          {settings.position === 'tiled' ? (
            <>
              <Slider
                label="Spacing"
                hint="Gap between the repeated texts. Smaller means more repetitions."
                value={settings.tileSpacingPercent}
                min={0}
                max={50}
                step={0.5}
                onChange={(tileSpacingPercent) => onChange({ tileSpacingPercent })}
                formatValue={(value) => `${value}%`}
              />
              <Slider
                label="Angle"
                value={settings.tileAngle}
                min={-90}
                max={90}
                step={5}
                onChange={(tileAngle) => onChange({ tileAngle })}
                formatValue={(value) => `${value}°`}
              />
            </>
          ) : (
            <Slider
              label="Margin"
              value={settings.marginPercent}
              min={0}
              max={20}
              step={0.5}
              onChange={(marginPercent) => onChange({ marginPercent })}
              formatValue={(value) => `${value}%`}
            />
          )}
        </>
      )}
    </>
  )
}
