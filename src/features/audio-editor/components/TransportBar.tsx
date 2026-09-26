import { Button } from '../../../components/Button'
import type { TimeRange } from '../lib/audioData'
import { formatTime } from '../lib/formatTime'
import { TimeField } from './TimeField'

interface TransportBarProps {
  position: number
  duration: number
  isPlaying: boolean
  selection: TimeRange | null
  onPlay: () => void
  onPause: () => void
  onStop: () => void
  onSelectionChange: (selection: TimeRange | null) => void
}

/** Play controls, playhead time and the editable selection range. */
export function TransportBar({
  position,
  duration,
  isPlaying,
  selection,
  onPlay,
  onPause,
  onStop,
  onSelectionChange,
}: TransportBarProps) {
  const start = selection?.start ?? 0
  const end = selection?.end ?? 0

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-xl border border-slate-200 bg-white px-3 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="flex items-center gap-2">
        {isPlaying ? (
          <Button variant="primary" onClick={onPause} className="w-32" title="Pause (Space)">
            Pause
          </Button>
        ) : (
          <Button variant="primary" onClick={onPlay} className="w-32" title="Play (Space)">
            {selection ? 'Play selection' : 'Play'}
          </Button>
        )}
        <Button onClick={onStop} title="Stop and go back to the start">
          Stop
        </Button>
        <span className="font-mono text-sm whitespace-nowrap tabular-nums" aria-label="Playhead position">
          {formatTime(position)}
          <span className="text-slate-400 dark:text-slate-500"> / {formatTime(duration)}</span>
        </span>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <TimeField
          key={`start-${start}`}
          label="Start"
          value={start}
          onCommit={(seconds) => onSelectionChange({ start: seconds, end: Math.max(seconds, end) })}
        />
        <TimeField
          key={`end-${end}`}
          label="End"
          value={end}
          onCommit={(seconds) => onSelectionChange({ start: Math.min(start, seconds), end: seconds })}
        />
        <span className="text-xs text-slate-500 tabular-nums dark:text-slate-400">
          Length {formatTime(Math.abs(end - start))}
        </span>
        <Button variant="ghost" onClick={() => onSelectionChange({ start: 0, end: duration })}>
          Select all
        </Button>
        <Button variant="ghost" onClick={() => onSelectionChange(null)} disabled={!selection} title="Clear selection (Esc)">
          Clear
        </Button>
      </div>
    </div>
  )
}
