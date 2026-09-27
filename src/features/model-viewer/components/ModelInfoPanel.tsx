import { Button } from '../../../components/Button'
import { formatCount, formatSize } from '../lib/formatStats'
import type { LoadedModel } from '../lib/loadModel'

interface ModelInfoPanelProps {
  model: LoadedModel
  clipIndex: number
  isPlaying: boolean
  onSelectClip: (index: number) => void
  onPlayingChange: (playing: boolean) => void
}

export function ModelInfoPanel({ model, clipIndex, isPlaying, onSelectClip, onPlayingChange }: ModelInfoPanelProps) {
  const { stats, animations } = model
  const rows: [string, string][] = [
    ['Format', model.format.toUpperCase()],
    ['Meshes', formatCount(stats.meshes)],
    ['Vertices', formatCount(stats.vertices)],
    ['Triangles', formatCount(stats.triangles)],
    ['Materials', formatCount(stats.materials)],
    ['Textures', formatCount(stats.textures)],
    ['Size (W × H × D)', formatSize(stats.size)],
  ]

  return (
    <aside className="shrink-0 space-y-5 overflow-auto border-t border-slate-200 bg-white p-4 text-sm lg:w-72 lg:border-t-0 lg:border-l dark:border-slate-800 dark:bg-slate-900">
      <section>
        <h2 className="mb-2 font-semibold">Model</h2>
        <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-slate-500 dark:text-slate-400">{label}</dt>
              <dd className="text-right tabular-nums">{value}</dd>
            </div>
          ))}
        </dl>
      </section>

      {animations.length > 0 && (
        <section>
          <h2 className="mb-2 font-semibold">Animation</h2>
          <div className="flex gap-2">
            <select
              aria-label="Animation clip"
              className="min-w-0 flex-1 rounded-md border border-slate-300 bg-white px-2 py-1 dark:border-slate-600 dark:bg-slate-800"
              value={clipIndex}
              onChange={(event) => onSelectClip(Number(event.target.value))}
            >
              {animations.map((clip, index) => (
                <option key={index} value={index}>
                  {clip.name || `Animation ${index + 1}`}
                </option>
              ))}
            </select>
            <Button onClick={() => onPlayingChange(!isPlaying)}>{isPlaying ? 'Pause' : 'Play'}</Button>
          </div>
        </section>
      )}

      <section className="text-xs text-slate-500 dark:text-slate-400">
        <h2 className="mb-1 text-sm font-semibold text-slate-900 dark:text-slate-100">Controls</h2>
        <p>Drag to orbit · Right-drag or Shift+drag to pan · Scroll or pinch to zoom</p>
      </section>
    </aside>
  )
}
