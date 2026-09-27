interface StatCardProps {
  label: string
  value: string
  hint?: string
  /** Highlighted cards are larger and use the accent color. */
  highlighted?: boolean
}

export function StatCard({ label, value, hint, highlighted = false }: StatCardProps) {
  return (
    <div
      className={`rounded-lg border p-3 ${
        highlighted
          ? 'border-sky-200 bg-sky-50 dark:border-sky-900 dark:bg-sky-950/40'
          : 'border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900'
      }`}
    >
      <dt className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</dt>
      <dd
        className={`mt-1 font-semibold whitespace-nowrap tabular-nums ${
          highlighted ? 'text-xl text-sky-700 dark:text-sky-400' : 'text-base text-slate-900 dark:text-slate-100'
        }`}
      >
        {value}
      </dd>
      {hint && <dd className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{hint}</dd>}
    </div>
  )
}
