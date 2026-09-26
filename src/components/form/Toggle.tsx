interface ToggleProps {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
}

export function Toggle({ label, checked, onChange, disabled }: ToggleProps) {
  return (
    <label className="inline-flex cursor-pointer items-center gap-2 text-sm text-slate-700 has-disabled:cursor-not-allowed has-disabled:opacity-60 dark:text-slate-300">
      <input
        type="checkbox"
        className="size-4 rounded accent-sky-600"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      {label}
    </label>
  )
}
