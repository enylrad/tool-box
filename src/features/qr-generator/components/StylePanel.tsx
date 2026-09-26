import { ColorInput } from '../../../components/form/ColorInput'
import { SegmentedControl } from '../../../components/form/SegmentedControl'
import type { SelectOption } from '../../../components/form/Select'
import { Slider } from '../../../components/form/Slider'
import { Toggle } from '../../../components/form/Toggle'
import type { QrStyleSettings } from '../hooks/useQrStyle'
import type { ErrorCorrectionLevel } from '../lib/qrMatrix'
import type { ModuleShape } from '../lib/svgRenderer'

const MODULE_SHAPES: SelectOption<ModuleShape>[] = [
  { value: 'square', label: 'Square' },
  { value: 'rounded', label: 'Rounded' },
  { value: 'dots', label: 'Dots' },
]

const ERROR_CORRECTION_LEVELS: SelectOption<ErrorCorrectionLevel>[] = [
  { value: 'L', label: 'L · 7%' },
  { value: 'M', label: 'M · 15%' },
  { value: 'Q', label: 'Q · 25%' },
  { value: 'H', label: 'H · 30%' },
]

interface StylePanelProps {
  style: QrStyleSettings
  onChange: (patch: Partial<QrStyleSettings>) => void
  /** Set when a logo forces the highest error correction level. */
  isErrorCorrectionForced: boolean
}

export function StylePanel({ style, onChange, isErrorCorrectionForced }: StylePanelProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <ColorInput label="Code color" value={style.foreground} onChange={(foreground) => onChange({ foreground })} />
        <ColorInput
          label="Background"
          value={style.background}
          onChange={(background) => onChange({ background })}
          disabled={style.transparentBackground}
        />
      </div>
      <Toggle
        label="Transparent background"
        checked={style.transparentBackground}
        onChange={(transparentBackground) => onChange({ transparentBackground })}
      />
      <SegmentedControl
        label="Module shape"
        value={style.moduleShape}
        options={MODULE_SHAPES}
        onChange={(moduleShape) => onChange({ moduleShape })}
      />
      <SegmentedControl
        label="Error correction"
        value={isErrorCorrectionForced ? 'H' : style.errorCorrection}
        options={ERROR_CORRECTION_LEVELS}
        onChange={(errorCorrection) => onChange({ errorCorrection })}
        disabled={isErrorCorrectionForced}
        hint={
          isErrorCorrectionForced
            ? 'Set to H because the logo covers part of the code.'
            : 'How much of the code can be damaged and still scan. Higher levels make the code denser.'
        }
      />
      <Slider
        label="Margin"
        value={style.margin}
        min={0}
        max={8}
        onChange={(margin) => onChange({ margin })}
        formatValue={(value) => `${value} module${value === 1 ? '' : 's'}`}
        hint="Scanners need a clear border around the code; 4 is the standard."
      />
    </>
  )
}
