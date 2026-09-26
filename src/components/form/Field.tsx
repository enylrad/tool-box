import { useId, type ReactNode } from 'react'

interface FieldProps {
  label: string
  hint?: string
  error?: string | null
  /** Receives the id to put on the input so the label is linked to it. */
  children: (inputId: string) => ReactNode
}

export function Field({ label, hint, error, children }: FieldProps) {
  const inputId = useId()
  return (
    <div className="space-y-1">
      <label htmlFor={inputId} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
        {label}
      </label>
      {children(inputId)}
      {error ? (
        <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : (
        hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>
      )}
    </div>
  )
}
