import { Field } from './Field'

interface SliderProps {
  label: string
  hint?: string
  value: number
  min: number
  max: number
  step?: number
  onChange: (value: number) => void
  formatValue?: (value: number) => string
}

export function Slider({ label, hint, value, min, max, step = 1, onChange, formatValue = String }: SliderProps) {
  return (
    <Field label={`${label}: ${formatValue(value)}`} hint={hint}>
      {(id) => (
        <input
          id={id}
          type="range"
          className="w-full accent-sky-600"
          value={value}
          min={min}
          max={max}
          step={step}
          onChange={(event) => onChange(Number(event.target.value))}
        />
      )}
    </Field>
  )
}
