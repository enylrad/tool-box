import { Panel } from '../../../components/Panel'
import type { PrivacyRisk, RiskLevel } from '../lib/privacyRisks'

const LEVELS: Record<RiskLevel, { label: string; badge: string; summary: string }> = {
  high: {
    label: 'High',
    badge: 'bg-red-100 text-red-800 ring-red-600/20 dark:bg-red-950 dark:text-red-300 dark:ring-red-400/30',
    summary: 'Anyone you send this file to can see where it was taken. Consider removing the metadata before sharing it.',
  },
  medium: {
    label: 'Medium',
    badge: 'bg-amber-100 text-amber-800 ring-amber-600/20 dark:bg-amber-950 dark:text-amber-300 dark:ring-amber-400/30',
    summary: 'The file contains details that can identify you or your device.',
  },
  low: {
    label: 'Low',
    badge: 'bg-sky-100 text-sky-800 ring-sky-600/20 dark:bg-sky-950 dark:text-sky-300 dark:ring-sky-400/30',
    summary: 'Only general details such as the date or camera model are stored.',
  },
  none: {
    label: 'None found',
    badge: 'bg-emerald-100 text-emerald-800 ring-emerald-600/20 dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/30',
    summary: 'No personal information was found in the metadata.',
  },
}

const DOT: Record<PrivacyRisk['level'], string> = {
  high: 'bg-red-500',
  medium: 'bg-amber-500',
  low: 'bg-sky-500',
}

interface PrivacySummaryProps {
  level: RiskLevel
  risks: PrivacyRisk[]
}

export function PrivacySummary({ level, risks }: PrivacySummaryProps) {
  const { label, badge, summary } = LEVELS[level]
  return (
    <Panel
      title="What this photo reveals"
      description={summary}
      actions={<span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold whitespace-nowrap ring-1 ring-inset ${badge}`}>Risk: {label}</span>}
    >
      {risks.length > 0 && (
        <ul className="space-y-2 text-sm">
          {risks.map((risk) => (
            <li key={risk.title} className="flex gap-3">
              <span className={`mt-1.5 size-2 shrink-0 rounded-full ${DOT[risk.level]}`} aria-label={`${risk.level} risk`} />
              <span className="min-w-0">
                <span className="font-medium">{risk.title}</span>
                {risk.detail && <span className="block break-words text-slate-500 dark:text-slate-400">{risk.detail}</span>}
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  )
}
