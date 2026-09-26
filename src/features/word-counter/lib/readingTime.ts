export interface ReadingSpeed {
  id: string
  label: string
  wordsPerMinute: number
}

/** Typical silent-reading and speaking rates for adult readers. */
export const READING_SPEEDS: ReadingSpeed[] = [
  { id: 'slow', label: 'Slow (150 wpm)', wordsPerMinute: 150 },
  { id: 'average', label: 'Average (230 wpm)', wordsPerMinute: 230 },
  { id: 'fast', label: 'Fast (300 wpm)', wordsPerMinute: 300 },
]

export const DEFAULT_READING_SPEED_ID = 'average'

/** Average pace of a speech or presentation. */
export const SPEAKING_WORDS_PER_MINUTE = 130

/** Seconds needed to get through `words` at `wordsPerMinute`, rounded up. */
export function estimateSeconds(words: number, wordsPerMinute: number): number {
  if (words <= 0 || wordsPerMinute <= 0) return 0
  return Math.ceil((words / wordsPerMinute) * 60)
}

/** Formats a duration as e.g. "45 s", "3 min 20 s" or "1 h 5 min". */
export function formatDuration(totalSeconds: number): string {
  const seconds = Math.max(0, Math.round(totalSeconds))
  if (seconds < 60) return `${seconds} s`

  const hours = Math.floor(seconds / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)
  const remainingSeconds = seconds % 60

  if (hours > 0) return minutes > 0 ? `${hours} h ${minutes} min` : `${hours} h`
  return remainingSeconds > 0 ? `${minutes} min ${remainingSeconds} s` : `${minutes} min`
}
