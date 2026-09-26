import { Button } from '../../../components/Button'
import { formatTimecode, isTrimmed, trimmedDuration, type TrimRange } from '../lib/timecode'
import { TimecodeInput } from './TimecodeInput'

interface TrimControlsProps {
  trim: TrimRange
  duration: number
  /** `null` when there is no preview to take the current frame from. */
  currentTime: number | null
  onChange: (trim: TrimRange) => void
}

export function TrimControls({ trim, duration, currentTime, onChange }: TrimControlsProps) {
  const end = trim.end ?? duration
  const clipLength = trimmedDuration(trim, duration) ?? duration

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-end gap-2">
        <TimecodeInput key={`start-${trim.start}`} label="Start" value={trim.start} onCommit={(start) => onChange({ ...trim, start })} />
        {currentTime !== null && (
          <Button onClick={() => onChange({ ...trim, start: currentTime })} title="Start the clip at the current frame">
            Set to current
          </Button>
        )}
      </div>
      <div className="flex items-end gap-2">
        <TimecodeInput key={`end-${end}`} label="End" value={end} onCommit={(value) => onChange({ ...trim, end: value })} />
        {currentTime !== null && (
          <Button onClick={() => onChange({ ...trim, end: currentTime })} title="End the clip at the current frame">
            Set to current
          </Button>
        )}
      </div>
      <div className="flex items-center justify-between text-sm">
        <span className="text-slate-600 dark:text-slate-400">
          Clip length: <span className="font-mono tabular-nums">{formatTimecode(clipLength)}</span>
        </span>
        {isTrimmed(trim, duration) && (
          <Button variant="ghost" onClick={() => onChange({ start: 0, end: null })}>
            Reset
          </Button>
        )}
      </div>
    </div>
  )
}
