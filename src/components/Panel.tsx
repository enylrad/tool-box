import type { ReactNode } from 'react'

interface PanelProps {
  title: string
  description?: string
  actions?: ReactNode
  children: ReactNode
}

/** A titled card used to group related controls. */
export function Panel({ title, description, actions, children }: PanelProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 dark:border-slate-800 dark:bg-slate-900">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <h2 className="font-semibold text-slate-900 dark:text-slate-100">{title}</h2>
          {description && <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{description}</p>}
        </div>
        {actions}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  )
}
