import type { ReactNode } from 'react'

interface SectionProps {
  title: string
  /** Shown instead of the content when the section does not apply. */
  disabledReason?: string | null
  actions?: ReactNode
  children: ReactNode
}

export function Section({ title, disabledReason, actions, children }: SectionProps) {
  return (
    <section className="border-b border-slate-200 px-4 py-4 dark:border-slate-800">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</h2>
        {!disabledReason && actions}
      </div>
      {disabledReason ? <p className="text-sm text-slate-500 dark:text-slate-400">{disabledReason}</p> : children}
    </section>
  )
}
