import { ELEVATION_STOPS, GRADE_BANDS, type ColorMode } from '../lib/colorScale'
import { formatElevation } from '../lib/format'

interface ColorLegendProps {
  mode: ColorMode
  minEle: number | null
  maxEle: number | null
}

export function ColorLegend({ mode, minEle, maxEle }: ColorLegendProps) {
  if (minEle === null || maxEle === null) return null

  if (mode === 'elevation') {
    return (
      <div className="flex items-center gap-2 text-xs text-slate-600 tabular-nums dark:text-slate-300" aria-label="Elevation color scale">
        <span>{formatElevation(minEle)}</span>
        <span className="h-2.5 w-32 rounded-full" style={{ background: `linear-gradient(to right, ${ELEVATION_STOPS.join(', ')})` }} />
        <span>{formatElevation(maxEle)}</span>
      </div>
    )
  }

  return (
    <ul className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-slate-600 dark:text-slate-300" aria-label="Grade colors">
      {GRADE_BANDS.map((band) => (
        <li key={band.label} className="flex items-center gap-1 whitespace-nowrap">
          <span className="size-2.5 rounded-sm" style={{ backgroundColor: band.color }} />
          {band.label}
        </li>
      ))}
    </ul>
  )
}
