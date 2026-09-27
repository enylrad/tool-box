import { Panel } from '../../../components/Panel'
import type { C2paInfo } from '../lib/c2pa'
import { aiVerdict, type EditSignals } from '../lib/editSignals'

interface EditHistoryCardProps {
  edits: EditSignals
  c2pa: C2paInfo
}

export function EditHistoryCard({ edits, c2pa }: EditHistoryCardProps) {
  const verdict = aiVerdict(edits.ai)
  const nothingFound = edits.software.length === 0 && edits.history.length === 0 && !edits.modifiedAfterCapture

  return (
    <Panel title="Editing & AI" description="Signs that the image was edited or generated.">
      <div className="space-y-4 text-sm">
        <section>
          <h3 className="font-medium">AI detection</h3>
          {verdict ? (
            <>
              <p className="mt-1 font-semibold text-violet-700 dark:text-violet-300">{verdict}</p>
              <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
                {edits.ai.map((signal) => (
                  <li key={signal.text}>{signal.text}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-1 text-slate-600 dark:text-slate-300">No AI markers found in the metadata.</p>
          )}
          {edits.prompt && (
            <details className="mt-2">
              <summary className="cursor-pointer text-slate-600 dark:text-slate-300">Generation prompt ({edits.prompt.source})</summary>
              <pre className="mt-2 max-h-64 overflow-auto rounded-md bg-slate-100 p-3 text-xs break-words whitespace-pre-wrap dark:bg-slate-800">
                {edits.prompt.text}
              </pre>
            </details>
          )}
        </section>

        <section>
          <h3 className="font-medium">Content Credentials (C2PA)</h3>
          {c2pa.present ? (
            <>
              <p className="mt-1 text-slate-600 dark:text-slate-300">
                A C2PA manifest is present. <strong>Not verified</strong>: checking its signature needs online certificate lists.
              </p>
              {c2pa.hints.length > 0 && (
                <p className="mt-1 break-words text-xs text-slate-500 dark:text-slate-400">Mentions: {c2pa.hints.join(' · ')}</p>
              )}
            </>
          ) : (
            <p className="mt-1 text-slate-600 dark:text-slate-300">None.</p>
          )}
        </section>

        <section>
          <h3 className="font-medium">Editing</h3>
          {nothingFound ? (
            <p className="mt-1 text-slate-600 dark:text-slate-300">No editing software or history recorded.</p>
          ) : (
            <ul className="mt-1 list-disc space-y-1 pl-5 text-slate-600 dark:text-slate-300">
              {edits.software.length > 0 && <li>Software: {edits.software.join(', ')}</li>}
              {edits.modifiedAfterCapture && <li>The metadata was modified after the photo was taken.</li>}
            </ul>
          )}
          {edits.history.length > 0 && (
            <ol className="mt-2 space-y-1 border-l-2 border-slate-200 pl-3 text-xs dark:border-slate-700">
              {edits.history.map((entry, index) => (
                <li key={index}>
                  <span className="font-medium">{entry.action ?? 'changed'}</span>
                  {entry.software && ` with ${entry.software}`}
                  {entry.when && <span className="text-slate-500 dark:text-slate-400"> · {entry.when}</span>}
                </li>
              ))}
            </ol>
          )}
        </section>

        <p className="text-xs text-slate-500 dark:text-slate-400">
          Metadata is easy to remove or fake, so a clean result does not prove that a photo is authentic.
        </p>
      </div>
    </Panel>
  )
}
