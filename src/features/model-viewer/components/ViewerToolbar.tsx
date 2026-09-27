import { Button } from '../../../components/Button'
import { Toggle } from '../../../components/form/Toggle'
import type { SelectOption } from '../../../components/form/Select'
import type { ViewerSettings } from '../hooks/useViewerSettings'
import type { ViewerBackground } from '../lib/ViewerScene'

const BACKGROUND_OPTIONS: readonly SelectOption<ViewerBackground>[] = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'transparent', label: 'Transparent' },
]

interface ViewerToolbarProps {
  settings: ViewerSettings
  onChange: (changes: Partial<ViewerSettings>) => void
  onResetView: () => void
  onScreenshot: () => void
  disabled: boolean
}

export function ViewerToolbar({ settings, onChange, onResetView, onScreenshot, disabled }: ViewerToolbarProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      <Toggle label="Wireframe" checked={settings.wireframe} onChange={(wireframe) => onChange({ wireframe })} />
      <Toggle label="Grid & axes" checked={settings.showGrid} onChange={(showGrid) => onChange({ showGrid })} />
      <Toggle label="Auto-rotate" checked={settings.autoRotate} onChange={(autoRotate) => onChange({ autoRotate })} />
      <label className="inline-flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        Background
        <select
          className="rounded-md border border-slate-300 bg-white px-2 py-1 text-sm dark:border-slate-600 dark:bg-slate-800"
          value={settings.background}
          onChange={(event) => onChange({ background: event.target.value as ViewerBackground })}
        >
          {BACKGROUND_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      <div className="ml-auto flex gap-2">
        <Button onClick={onResetView} disabled={disabled}>
          Reset view
        </Button>
        <Button onClick={onScreenshot} disabled={disabled}>
          Save PNG
        </Button>
      </div>
    </div>
  )
}
