import { ColorInput } from '../../../components/form/ColorInput'
import { SegmentedControl } from '../../../components/form/SegmentedControl'
import { Slider } from '../../../components/form/Slider'
import { Toggle } from '../../../components/form/Toggle'
import type { IconSettings } from '../hooks/useIconSettings'
import { MAX_PADDING, type IconShape } from '../lib/layout'

const SHAPE_OPTIONS = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'circle', label: 'Circle' },
] as const satisfies readonly { value: IconShape; label: string }[]

interface AppearancePanelProps {
  settings: IconSettings
  onChange: (patch: Partial<IconSettings>) => void
}

export function AppearancePanel({ settings, onChange }: AppearancePanelProps) {
  return (
    <>
      <ColorInput label="Background color" value={settings.backgroundColor} onChange={(backgroundColor) => onChange({ backgroundColor })} />
      <Toggle
        label="Transparent background where allowed"
        checked={settings.transparentBackground}
        onChange={(transparentBackground) => onChange({ transparentBackground })}
      />
      <p className="text-xs text-slate-500 dark:text-slate-400">
        iOS, Apple touch, Play Store, maskable and Android adaptive icons cannot be transparent, so they always use the background color.
      </p>
      <SegmentedControl
        label="Shape"
        value={settings.shape}
        options={SHAPE_OPTIONS}
        onChange={(shape) => onChange({ shape })}
        hint="Applied to favicons, Windows icons and Android legacy icons. iOS and Android mask their icons themselves."
      />
      <Slider
        label="Padding"
        value={Math.round(settings.padding * 100)}
        min={0}
        max={MAX_PADDING * 100}
        onChange={(percent) => onChange({ padding: percent / 100 })}
        formatValue={(value) => `${value}%`}
        hint="Empty space around the image on each side."
      />
    </>
  )
}
