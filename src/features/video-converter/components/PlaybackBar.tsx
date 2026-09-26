import { formatTimecode, type TrimRange } from '../lib/timecode'

interface PlaybackBarProps {
  currentTime: number
  duration: number
  isPlaying: boolean
  trim: TrimRange
  onTogglePlay: () => void
  onSeek: (time: number) => void
}

export function PlaybackBar({ currentTime, duration, isPlaying, trim, onTogglePlay, onSeek }: PlaybackBarProps) {
  const toPercent = (time: number) => `${(Math.min(Math.max(time, 0), duration) / duration) * 100}%`
  const end = trim.end ?? duration

  return (
    <div className="flex items-center gap-3 border-t border-slate-800 bg-slate-900 px-4 py-2 text-slate-100">
      <button
        type="button"
        onClick={onTogglePlay}
        aria-label={isPlaying ? 'Pause' : 'Play clip'}
        className="flex size-9 shrink-0 items-center justify-center rounded-full bg-white/10 hover:bg-white/20 focus-visible:outline-2 focus-visible:outline-sky-500"
      >
        {isPlaying ? (
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
            <rect x="6" y="5" width="4" height="14" rx="1" />
            <rect x="14" y="5" width="4" height="14" rx="1" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="size-4" fill="currentColor" aria-hidden="true">
            <path d="M7 5.5v13a1 1 0 0 0 1.5.86l11-6.5a1 1 0 0 0 0-1.72l-11-6.5A1 1 0 0 0 7 5.5Z" />
          </svg>
        )}
      </button>
      <div className="relative flex h-9 min-w-0 flex-1 items-center">
        {/* The highlighted band is the part of the video that will be exported. */}
        <div className="pointer-events-none absolute inset-x-0 h-1.5 rounded-full bg-white/15" />
        <div
          className="pointer-events-none absolute h-1.5 rounded-full bg-sky-500"
          style={{ left: toPercent(trim.start), right: `calc(100% - ${toPercent(end)})` }}
        />
        <input
          type="range"
          min={0}
          max={duration}
          step={0.01}
          value={Math.min(currentTime, duration)}
          onChange={(event) => onSeek(Number(event.target.value))}
          aria-label="Position"
          className="relative w-full cursor-pointer appearance-none bg-transparent accent-white [&::-moz-range-thumb]:size-3.5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-white [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:size-3.5 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
        />
      </div>
      <span className="shrink-0 font-mono text-xs text-slate-300 tabular-nums">
        {formatTimecode(currentTime)} / {formatTimecode(duration)}
      </span>
    </div>
  )
}
