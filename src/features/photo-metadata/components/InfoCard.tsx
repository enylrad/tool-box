import type { ReactNode } from 'react'
import { Panel } from '../../../components/Panel'
import type { InfoRow } from '../lib/infoRows'

interface InfoCardProps {
  title: string
  description?: string
  rows: (InfoRow & { value: string })[]
  empty?: string
  children?: ReactNode
}

export function InfoList({ rows }: { rows: (InfoRow & { value: string })[] }) {
  return (
    <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-[minmax(8rem,auto)_1fr]">
      {rows.map((row) => (
        <div key={row.label} className="contents">
          <dt className="text-slate-500 dark:text-slate-400">{row.label}</dt>
          <dd className="mb-1 min-w-0 break-words text-slate-900 sm:mb-0 dark:text-slate-100">
            <span className={row.mono ? 'font-mono text-xs' : undefined}>{row.value}</span>
            {row.hint && <span className="ml-2 text-xs text-slate-500 dark:text-slate-400">{row.hint}</span>}
          </dd>
        </div>
      ))}
    </dl>
  )
}

/** A titled card with a label/value list. */
export function InfoCard({ title, description, rows, empty, children }: InfoCardProps) {
  return (
    <Panel title={title} description={description}>
      {rows.length > 0 ? <InfoList rows={rows} /> : empty && <p className="text-sm text-slate-500 dark:text-slate-400">{empty}</p>}
      {children}
    </Panel>
  )
}
