import { Panel } from '../../../components/Panel'
import { SegmentedControl } from '../../../components/form/SegmentedControl'
import { Slider } from '../../../components/form/Slider'
import { Toggle } from '../../../components/form/Toggle'
import { CHARSETS } from '../lib/charsets'
import { MAX_LENGTH, MIN_LENGTH, type PasswordOptions } from '../lib/generatePassword'
import { COUNT_OPTIONS, type PasswordCount } from '../lib/passwordCount'

interface OptionsPanelProps {
  options: PasswordOptions
  onChange: (changes: Partial<PasswordOptions>) => void
  count: PasswordCount
  onCountChange: (count: PasswordCount) => void
}

export function OptionsPanel({ options, onChange, count, onCountChange }: OptionsPanelProps) {
  const enabledCount = CHARSETS.filter((charset) => options[charset.id]).length

  return (
    <Panel title="Options">
      <Slider
        label="Length"
        value={options.length}
        min={MIN_LENGTH}
        max={MAX_LENGTH}
        onChange={(length) => onChange({ length })}
        formatValue={(value) => `${value} characters`}
      />
      <fieldset className="space-y-2">
        <legend className="mb-2 text-sm font-medium text-slate-700 dark:text-slate-300">Characters</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {CHARSETS.map((charset) => (
            <Toggle
              key={charset.id}
              label={charset.label}
              checked={options[charset.id]}
              // At least one character type must stay enabled.
              disabled={options[charset.id] && enabledCount === 1}
              onChange={(checked) => onChange({ [charset.id]: checked })}
            />
          ))}
        </div>
        <Toggle
          label="Avoid look-alike characters (I, l, 1, O, 0, o)"
          checked={options.excludeAmbiguous}
          onChange={(excludeAmbiguous) => onChange({ excludeAmbiguous })}
        />
      </fieldset>
      <SegmentedControl label="How many passwords" value={count} options={COUNT_OPTIONS} onChange={onCountChange} />
    </Panel>
  )
}
