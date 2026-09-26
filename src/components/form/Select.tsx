import { Field } from './Field'
import { INPUT_CLASS } from './formStyles'

export interface SelectOption<T extends string> {
  value: T
  label: string
}

interface SelectProps<T extends string> {
  label: string
  hint?: string
  value: T
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
}

export function Select<T extends string>({ label, hint, value, options, onChange }: SelectProps<T>) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <select id={id} className={INPUT_CLASS} value={value} onChange={(event) => onChange(event.target.value as T)}>
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      )}
    </Field>
  )
}
