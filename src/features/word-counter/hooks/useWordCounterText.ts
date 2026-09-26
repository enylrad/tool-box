import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { DEFAULT_READING_SPEED_ID, READING_SPEEDS } from '../lib/readingTime'

const TEXT_STORAGE_KEY = 'tool-box:word-counter:text'
const SPEED_STORAGE_KEY = 'tool-box:word-counter:reading-speed'

/** The text being counted and the chosen reading speed, both auto-saved to localStorage. */
export function useWordCounterText() {
  const [text, setText, saveStatus] = useLocalStorage(TEXT_STORAGE_KEY, '')
  const [readingSpeedId, setReadingSpeedId] = useLocalStorage(SPEED_STORAGE_KEY, DEFAULT_READING_SPEED_ID)

  // A stored id may no longer exist if the list of speeds changes.
  const readingSpeed =
    READING_SPEEDS.find((speed) => speed.id === readingSpeedId) ??
    READING_SPEEDS.find((speed) => speed.id === DEFAULT_READING_SPEED_ID)!

  return { text, setText, saveStatus, readingSpeed, setReadingSpeedId }
}
