import { READING_SPEEDS, SPEAKING_WORDS_PER_MINUTE, estimateSeconds, formatDuration, type ReadingSpeed } from '../lib/readingTime'
import type { TextStats } from '../lib/textStats'
import { StatCard } from './StatCard'

interface StatsPanelProps {
  stats: TextStats
  readingSpeed: ReadingSpeed
  onReadingSpeedChange: (id: string) => void
}

const numberFormat = new Intl.NumberFormat()

export function StatsPanel({ stats, readingSpeed, onReadingSpeedChange }: StatsPanelProps) {
  const format = (value: number) => numberFormat.format(value)
  const readingTime = formatDuration(estimateSeconds(stats.words, readingSpeed.wordsPerMinute))
  const speakingTime = formatDuration(estimateSeconds(stats.words, SPEAKING_WORDS_PER_MINUTE))

  return (
    <div className="flex flex-col gap-4 p-4">
      <dl className="grid grid-cols-2 gap-3" aria-live="polite">
        <StatCard highlighted label="Words" value={format(stats.words)} />
        <StatCard highlighted label="Characters" value={format(stats.characters)} />
        <StatCard className="col-span-2" highlighted label="Reading time" value={readingTime} hint={`At ${readingSpeed.wordsPerMinute} words per minute`} />
        <StatCard label="Characters (no spaces)" value={format(stats.charactersNoSpaces)} />
        <StatCard label="Sentences" value={format(stats.sentences)} />
        <StatCard label="Paragraphs" value={format(stats.paragraphs)} />
        <StatCard label="Lines" value={format(stats.lines)} />
        <StatCard className="col-span-2" label="Speaking time" value={speakingTime} hint={`Reading aloud at ${SPEAKING_WORDS_PER_MINUTE} words per minute`} />
      </dl>
      <label className="flex flex-col gap-1 text-xs font-medium text-slate-600 dark:text-slate-400">
        Reading speed
        <select
          className="rounded-md bg-white px-2 py-1.5 text-sm text-slate-900 ring-1 ring-inset ring-slate-300 dark:bg-slate-800 dark:text-slate-100 dark:ring-slate-600"
          value={readingSpeed.id}
          onChange={(event) => onReadingSpeedChange(event.target.value)}
        >
          {READING_SPEEDS.map((speed) => (
            <option key={speed.id} value={speed.id}>
              {speed.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  )
}
