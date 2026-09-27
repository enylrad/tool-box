import { SegmentedControl } from '../../../components/form/SegmentedControl'
import { Slider } from '../../../components/form/Slider'
import { Toggle } from '../../../components/form/Toggle'
import type { Size } from '../../../lib/cropGeometry'
import { MAX_PERCENT, MAX_SIDE, type ResizeMode, type ResizeSettings } from '../lib/resize'
import { NumberField } from './NumberField'

interface ResizePanelProps {
  settings: ResizeSettings
  cropSize: Size
  outputSize: Size
  onChange: (patch: Partial<ResizeSettings>) => void
}

const MODE_OPTIONS: { value: ResizeMode; label: string }[] = [
  { value: 'original', label: 'Original' },
  { value: 'percent', label: 'Percent' },
  { value: 'custom', label: 'Custom' },
]

export function ResizePanel({ settings, cropSize, outputSize, onChange }: ResizePanelProps) {
  const isLimited =
    settings.mode !== 'original' || outputSize.width !== cropSize.width || outputSize.height !== cropSize.height

  return (
    <>
      <SegmentedControl label="Size" value={settings.mode} options={MODE_OPTIONS} onChange={(mode) => onChange({ mode })} />

      {settings.mode === 'percent' && (
        <Slider
          label="Scale"
          value={settings.percent}
          min={1}
          max={MAX_PERCENT}
          onChange={(percent) => onChange({ percent })}
          formatValue={(value) => `${value}%`}
        />
      )}

      {settings.mode === 'custom' && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <NumberField
              label={settings.keepAspect ? 'Max width' : 'Width'}
              value={settings.width}
              min={1}
              max={MAX_SIDE}
              suffix="px"
              onChange={(width) => onChange({ width })}
            />
            <NumberField
              label={settings.keepAspect ? 'Max height' : 'Height'}
              value={settings.height}
              min={1}
              max={MAX_SIDE}
              suffix="px"
              onChange={(height) => onChange({ height })}
            />
          </div>
          <Toggle label="Keep proportions" checked={settings.keepAspect} onChange={(keepAspect) => onChange({ keepAspect })} />
          <p className="-mt-2 text-xs text-slate-500 dark:text-slate-400">
            {settings.keepAspect
              ? 'The image fits inside this box without being stretched.'
              : 'The image is stretched to exactly this size.'}
          </p>
        </>
      )}

      <p className="text-sm text-slate-600 tabular-nums dark:text-slate-300">
        Output:{' '}
        <span className="font-mono font-medium text-slate-900 dark:text-slate-100">
          {outputSize.width}×{outputSize.height}
        </span>{' '}
        px
        {isLimited && (
          <span className="text-slate-500 dark:text-slate-400">
            {' '}
            (crop {cropSize.width}×{cropSize.height})
          </span>
        )}
      </p>
    </>
  )
}
