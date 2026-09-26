import { useDeferredValue, useMemo } from 'react'
import { Button } from '../../components/Button'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import type { PersistStatus } from '../../hooks/useLocalStorage'
import { StatsPanel } from './components/StatsPanel'
import { useWordCounterText } from './hooks/useWordCounterText'
import { getTextStats } from './lib/textStats'

const SAVE_STATUS_LABELS: Record<PersistStatus, string> = {
  saved: 'Saved in this browser',
  pending: 'Saving…',
  error: 'Could not save (storage unavailable)',
}

export default function WordCounterPage() {
  useDocumentTitle('Word Counter')

  const { text, setText, saveStatus, readingSpeed, setReadingSpeedId } = useWordCounterText()
  // Counting very long texts can take a few milliseconds; deferring it keeps typing smooth.
  const deferredText = useDeferredValue(text)
  const stats = useMemo(() => getTextStats(deferredText), [deferredText])

  const handleClear = () => {
    if (text === '' || window.confirm('Delete all the text? This cannot be undone.')) {
      setText('')
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0 flex-1 basis-56">
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">Word Counter</h1>
          <p
            className={`text-xs ${saveStatus === 'error' ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}
            aria-live="polite"
          >
            {SAVE_STATUS_LABELS[saveStatus]}
          </p>
        </div>
        <Button variant="ghost" onClick={handleClear} disabled={text === ''}>
          Clear
        </Button>
      </div>
      {/* On small screens the stats sit above the text so they stay visible while typing. */}
      <div className="flex min-h-0 flex-1 flex-col-reverse md:grid md:grid-cols-[1fr_20rem] md:divide-x md:divide-slate-200 dark:md:divide-slate-800">
        <textarea
          aria-label="Text to count"
          className="min-h-0 w-full flex-1 resize-none bg-white p-4 text-base leading-relaxed text-slate-900 outline-none md:h-full dark:bg-slate-950 dark:text-slate-100"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Type or paste your text here…"
          autoFocus
        />
        <aside
          aria-label="Statistics"
          className="max-h-[45%] shrink-0 overflow-auto border-b border-slate-200 bg-slate-50 md:max-h-none md:border-b-0 dark:border-slate-800 dark:bg-slate-950"
        >
          <StatsPanel stats={stats} readingSpeed={readingSpeed} onReadingSpeedChange={setReadingSpeedId} />
        </aside>
      </div>
    </div>
  )
}
