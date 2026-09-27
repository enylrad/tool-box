import { useState } from 'react'
import { Field } from '../../../components/form/Field'
import { INPUT_CLASS } from '../../../components/form/formStyles'

interface NumberFieldProps {
  label: string
  value: number
  min: number
  max: number
  suffix?: string
  onChange: (value: number) => void
}

/** Whole-number input that lets the field be empty while typing and only commits valid values. */
export function NumberField({ label, value, min, max, suffix, onChange }: NumberFieldProps) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-1.5">
          <input
            id={id}
            type="number"
            inputMode="numeric"
            min={min}
            max={max}
            className={`${INPUT_CLASS} font-mono tabular-nums`}
            value={draft ?? value}
            onChange={(event) => {
              setDraft(event.target.value)
              const next = event.target.valueAsNumber
              if (Number.isFinite(next) && next >= min && next <= max) onChange(Math.round(next))
            }}
            onBlur={() => setDraft(null)}
          />
          {suffix && <span className="text-xs text-slate-500 dark:text-slate-400">{suffix}</span>}
        </div>
      )}
    </Field>
  )
}
