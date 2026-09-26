import { useState, type KeyboardEvent } from 'react'
import { formatTime, parseTime } from '../lib/formatTime'

interface TimeFieldProps {
  label: string
  value: number
  onCommit: (seconds: number) => void
  disabled?: boolean
}

/**
 * Text input for a time such as `1:23.500`. The value is applied on Enter or
 * blur; invalid text is reverted. Give it `key={value}` so outside changes
 * replace the draft.
 */
export function TimeField({ label, value, onCommit, disabled }: TimeFieldProps) {
  const [draft, setDraft] = useState(() => formatTime(value))
  const [isInvalid, setIsInvalid] = useState(false)

  const commit = () => {
    const seconds = parseTime(draft)
    if (seconds === null) {
      setIsInvalid(true)
      setDraft(formatTime(value))
      return
    }
    setIsInvalid(false)
    if (seconds !== value) onCommit(seconds)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') commit()
    if (event.key === 'Escape') setDraft(formatTime(value))
  }

  return (
    <label className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400">
      {label}
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        disabled={disabled}
        aria-invalid={isInvalid}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={handleKeyDown}
        className="w-24 rounded-md border border-slate-300 bg-white px-2 py-1 font-mono text-sm text-slate-900 tabular-nums disabled:opacity-60 aria-invalid:border-red-500 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  )
}
