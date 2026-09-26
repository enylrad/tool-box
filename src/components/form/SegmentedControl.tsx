import type { SelectOption } from './Select'

interface SegmentedControlProps<T extends string> {
  label: string
  value: T
  options: readonly SelectOption<T>[]
  onChange: (value: T) => void
  disabled?: boolean
  hint?: string
}

/** A compact single-choice group, rendered as a row of toggle buttons. */
export function SegmentedControl<T extends string>({ label, value, options, onChange, disabled, hint }: SegmentedControlProps<T>) {
  return (
    <fieldset className="space-y-1" disabled={disabled}>
      <legend className="text-sm font-medium text-slate-700 dark:text-slate-300">{label}</legend>
      <div className="flex flex-wrap gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
        {options.map((option) => {
          const isActive = option.value === value
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={isActive}
              onClick={() => onChange(option.value)}
              className={`flex-1 rounded-md disabled:cursor-not-allowed disabled:opacity-60 px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
              }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>
      {hint && <p className="text-xs text-slate-500 dark:text-slate-400">{hint}</p>}
    </fieldset>
  )
}
