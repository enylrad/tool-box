import { useState } from 'react'
import { formatTimecode, parseTimecode } from '../lib/timecode'

interface TimecodeInputProps {
  label: string
  value: number
  onCommit: (seconds: number) => void
}

/**
 * Text field for `m:ss.s`. The value is applied on Enter or blur; invalid text
 * reverts. Render it with `key={value}` so outside changes replace the draft.
 */
export function TimecodeInput({ label, value, onCommit }: TimecodeInputProps) {
  const [draft, setDraft] = useState(() => formatTimecode(value))

  const commit = () => {
    const seconds = parseTimecode(draft)
    if (seconds === null) setDraft(formatTimecode(value))
    else onCommit(seconds)
  }

  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1 text-xs text-slate-500 dark:text-slate-400">
      {label}
      <input
        type="text"
        inputMode="decimal"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key === 'Enter') commit()
        }}
        className="w-full rounded-md border border-slate-300 bg-white px-2 py-1.5 font-mono text-sm text-slate-900 tabular-nums dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100"
      />
    </label>
  )
}
