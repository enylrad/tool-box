import { Suspense, lazy, useState } from 'react'
import { useLocalStorage } from '../../hooks/useLocalStorage'
import { ColorLegend } from './components/ColorLegend'
import { ElevationProfile } from './components/ElevationProfile'
import { StatsPanel } from './components/StatsPanel'
import { ToggleGroup } from './components/ToggleGroup'
import { TrackMap2D } from './components/TrackMap2D'
import type { LoadedRoute } from './hooks/useGpxFile'
import type { ColorMode } from './lib/colorScale'
import { nearestIndexAtDistance } from './lib/trackAnalysis'

// three.js is only downloaded when the 3D view is opened.
const TrackView3D = lazy(() => import('./components/TrackView3D'))

type ViewMode = '2d' | '3d'

const VIEW_OPTIONS = [
  { value: '2d', label: '2D' },
  { value: '3d', label: '3D' },
] as const

const COLOR_OPTIONS = [
  { value: 'grade', label: 'Grade' },
  { value: 'elevation', label: 'Elevation' },
] as const

interface RouteWorkspaceProps {
  route: LoadedRoute
}

/** The analysis screen for one loaded route: 2D/3D view, elevation profile and statistics. */
export function RouteWorkspace({ route }: RouteWorkspaceProps) {
  const { analysis, climbs, splits } = route
  const [viewMode, setViewMode] = useLocalStorage<ViewMode>('gpx-analyzer:view', '2d', { debounceMs: 0 })
  const [storedColorMode, setColorMode] = useLocalStorage<ColorMode>('gpx-analyzer:color', 'grade', { debounceMs: 0 })
  const [hoverIndex, setHoverIndex] = useState<number | null>(null)
  const colorMode: ColorMode = storedColorMode === 'elevation' ? 'elevation' : 'grade'

  const selectDistance = (distance: number) => setHoverIndex(nearestIndexAtDistance(analysis.points, distance))

  const view =
    viewMode === '3d' ? (
      <Suspense fallback={<p className="p-4 text-sm text-slate-500">Loading 3D view…</p>}>
        <TrackView3D analysis={analysis} colorMode={colorMode} hoverIndex={hoverIndex} onHoverChange={setHoverIndex} />
      </Suspense>
    ) : (
      <TrackMap2D analysis={analysis} colorMode={colorMode} hoverIndex={hoverIndex} onHoverChange={setHoverIndex} />
    )

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-auto md:grid md:grid-cols-[minmax(0,1fr)_22rem] md:overflow-hidden">
      <div className="flex shrink-0 flex-col md:min-h-0 md:shrink md:border-r md:border-slate-200 dark:md:border-slate-800">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
          <ToggleGroup label="View" value={viewMode === '3d' ? '3d' : '2d'} options={VIEW_OPTIONS} onChange={setViewMode} />
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 dark:text-slate-400">Color by</span>
            <ToggleGroup label="Color by" value={colorMode} options={COLOR_OPTIONS} onChange={setColorMode} disabled={!analysis.hasElevation} />
          </div>
          <ColorLegend mode={colorMode} minEle={analysis.stats.minEle} maxEle={analysis.stats.maxEle} />
        </div>
        <div className="h-[55vh] min-h-72 shrink-0 bg-slate-100 md:h-auto md:min-h-0 md:flex-1 dark:bg-[#0b1120]">{view}</div>
        <div className="h-52 shrink-0 border-t border-slate-200 bg-white p-2 dark:border-slate-800 dark:bg-slate-900">
          <ElevationProfile analysis={analysis} climbs={climbs} colorMode={colorMode} hoverIndex={hoverIndex} onHoverChange={setHoverIndex} />
        </div>
      </div>
      <aside aria-label="Route statistics" className="shrink-0 border-t border-slate-200 bg-slate-50 md:overflow-auto md:border-t-0 dark:border-slate-800 dark:bg-slate-950">
        <StatsPanel analysis={analysis} climbs={climbs} splits={splits} onSelectDistance={selectDistance} />
      </aside>
    </div>
  )
}
