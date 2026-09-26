import { useState } from 'react'
import { isHexColor } from '../../lib/color'
import { Field } from './Field'
import { INPUT_CLASS } from './formStyles'

interface ColorInputProps {
  label: string
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

/** Native color picker plus a hex text field that only commits valid colors. */
export function ColorInput({ label, value, onChange, disabled }: ColorInputProps) {
  const [draft, setDraft] = useState<string | null>(null)

  return (
    <Field label={label}>
      {(id) => (
        <div className="flex items-center gap-2">
          <input
            type="color"
            aria-label={`${label} picker`}
            className="h-8 w-10 shrink-0 cursor-pointer rounded border-0 bg-transparent p-0 disabled:cursor-not-allowed disabled:opacity-50"
            value={value}
            disabled={disabled}
            onChange={(event) => onChange(event.target.value)}
          />
          <input
            id={id}
            className={`${INPUT_CLASS} font-mono uppercase disabled:opacity-50`}
            value={draft ?? value}
            disabled={disabled}
            maxLength={7}
            spellCheck={false}
            onChange={(event) => {
              const next = event.target.value.startsWith('#') ? event.target.value : `#${event.target.value}`
              setDraft(next)
              if (isHexColor(next)) onChange(next.toLowerCase())
            }}
            onBlur={() => setDraft(null)}
          />
        </div>
      )}
    </Field>
  )
}
