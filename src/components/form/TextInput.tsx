import type { InputHTMLAttributes, TextareaHTMLAttributes } from 'react'
import { Field } from './Field'
import { INPUT_CLASS } from './formStyles'

interface TextInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'value'> {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
}

export function TextInput({ label, hint, value, onChange, type = 'text', ...inputProps }: TextInputProps) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <input
          id={id}
          type={type}
          className={INPUT_CLASS}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...inputProps}
        />
      )}
    </Field>
  )
}

interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value'> {
  label: string
  hint?: string
  value: string
  onChange: (value: string) => void
}

export function TextArea({ label, hint, value, onChange, rows = 4, ...textareaProps }: TextAreaProps) {
  return (
    <Field label={label} hint={hint}>
      {(id) => (
        <textarea
          id={id}
          rows={rows}
          className={`${INPUT_CLASS} resize-y`}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          {...textareaProps}
        />
      )}
    </Field>
  )
}
