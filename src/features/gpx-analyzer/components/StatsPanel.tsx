import type { ReactNode } from 'react'
import type { Climb } from '../lib/climbs'
import { gradeColor } from '../lib/colorScale'
import { formatDistance, formatDuration, formatElevation, formatGrade, formatPace, formatSpeed } from '../lib/format'
import type { Split } from '../lib/splits'
import type { TrackAnalysis } from '../lib/trackAnalysis'
import { StatCard } from './StatCard'

interface StatsPanelProps {
  analysis: TrackAnalysis
  climbs: Climb[]
  splits: Split[]
  onSelectDistance: (distance: number) => void
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-xs font-semibold tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</h2>
      {children}
    </section>
  )
}

function signedElevation(meters: number | null) {
  return meters === null ? '—' : `${meters >= 0 ? '+' : '−'}${formatElevation(Math.abs(meters))}`
}

export function StatsPanel({ analysis, climbs, splits, onSelectDistance }: StatsPanelProps) {
  const { stats, hasElevation, hasTime } = analysis
  const net = stats.startEle !== null && stats.endEle !== null ? stats.endEle - stats.startEle : null
  const splitUnit = splits.length > 1 ? formatDistance(splits[0].length) : null

  return (
    <div className="space-y-6 p-4">
      <Section title="Route">
        <dl className="grid grid-cols-2 gap-2">
          <StatCard label="Distance" value={formatDistance(stats.distance)} highlighted />
          <StatCard label="Ascent" value={hasElevation ? `↑ ${formatElevation(stats.gain)}` : '—'} highlighted />
          <StatCard label="Descent" value={hasElevation ? `↓ ${formatElevation(stats.loss)}` : '—'} />
          <StatCard label="Net change" value={signedElevation(net)} hint={hasElevation ? `${formatElevation(stats.startEle)} → ${formatElevation(stats.endEle)}` : undefined} />
          <StatCard label="Highest point" value={formatElevation(stats.maxEle)} />
          <StatCard label="Lowest point" value={formatElevation(stats.minEle)} />
          <StatCard label="Steepest climb" value={hasElevation ? formatGrade(stats.maxGrade) : '—'} hint="over 100 m" />
          <StatCard label="Steepest descent" value={hasElevation ? formatGrade(stats.minGrade) : '—'} hint="over 100 m" />
        </dl>
      </Section>

      {hasTime && (
        <Section title="Time">
          <dl className="grid grid-cols-2 gap-2">
            <StatCard label="Total time" value={formatDuration(stats.duration)} />
            <StatCard label="Moving time" value={formatDuration(stats.movingTime)} />
            <StatCard label="Average speed" value={formatSpeed(stats.averageSpeed)} hint={formatPace(stats.averageSpeed)} />
            <StatCard label="Moving speed" value={formatSpeed(stats.movingSpeed)} hint={formatPace(stats.movingSpeed)} />
            <StatCard label="Max speed" value={formatSpeed(stats.maxSpeed)} hint="over 50 m" />
            <StatCard
              label="Climbing rate"
              value={stats.gain !== null && stats.movingTime ? `${Math.round(stats.gain / (stats.movingTime / 3_600_000))} m/h` : '—'}
              hint="ascent per moving hour"
            />
          </dl>
        </Section>
      )}

      {hasElevation && (
        <Section title={`Climbs (${climbs.length})`}>
          {climbs.length === 0 ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">No climbs of 30 m or more.</p>
          ) : (
            <ol className="space-y-2">
              {climbs.map((climb, index) => (
                <li key={climb.startIndex}>
                  <button
                    type="button"
                    onClick={() => onSelectDistance(climb.startDistance + climb.length)}
                    className="flex w-full items-center gap-3 rounded-lg border border-slate-200 bg-white p-2.5 text-left text-sm hover:border-sky-400 dark:border-slate-800 dark:bg-slate-900 dark:hover:border-sky-500"
                  >
                    <span
                      className="flex size-8 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white"
                      style={{ backgroundColor: gradeColor(climb.averageGrade) }}
                    >
                      C{index + 1}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium tabular-nums">
                        ↑ {formatElevation(climb.gain)} · {formatGrade(climb.averageGrade)}
                      </span>
                      <span className="block text-xs text-slate-500 tabular-nums dark:text-slate-400">
                        {formatDistance(climb.length)} from km {(climb.startDistance / 1000).toFixed(1)} · top at {formatElevation(climb.endEle)}
                      </span>
                    </span>
                  </button>
                </li>
              ))}
            </ol>
          )}
        </Section>
      )}

      {splits.length > 1 && (
        <Section title={`Splits (every ${splitUnit})`}>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800">
            <table className="w-full text-right text-sm tabular-nums">
              <thead className="bg-slate-100 text-xs text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th scope="col" className="px-2 py-1.5 text-left font-medium">
                    km
                  </th>
                  {hasElevation && (
                    <>
                      <th scope="col" className="px-2 py-1.5 font-medium">
                        Ascent
                      </th>
                      <th scope="col" className="px-2 py-1.5 font-medium">
                        Descent
                      </th>
                    </>
                  )}
                  {hasTime && (
                    <th scope="col" className="px-2 py-1.5 font-medium">
                      Pace
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white dark:divide-slate-800 dark:bg-slate-950">
                {splits.map((split) => (
                  <tr
                    key={split.number}
                    className="cursor-pointer hover:bg-sky-50 dark:hover:bg-sky-950/40"
                    onClick={() => onSelectDistance(split.startDistance + split.length / 2)}
                  >
                    <td className="px-2 py-1 text-left">{((split.startDistance + split.length) / 1000).toFixed(split.length % 1000 === 0 ? 0 : 1)}</td>
                    {hasElevation && (
                      <>
                        <td className="px-2 py-1 text-rose-700 dark:text-rose-400">{formatElevation(split.gain)}</td>
                        <td className="px-2 py-1 text-sky-700 dark:text-sky-400">{formatElevation(split.loss)}</td>
                      </>
                    )}
                    {hasTime && (
                      <td className="px-2 py-1">{split.duration !== null && split.duration > 0 ? formatPace(split.length / (split.duration / 1000)) : '—'}</td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      )}

      <p className="text-xs text-slate-500 dark:text-slate-400">
        {stats.pointCount.toLocaleString('en-US')} points{stats.segmentCount > 1 ? ` in ${stats.segmentCount} segments` : ''}. Ascent and descent
        ignore changes under 3 m to filter out GPS noise, so they can differ slightly from other apps.
      </p>
    </div>
  )
}
