import { useLocalStorage } from '../../../hooks/useLocalStorage'
import type { ViewerBackground } from '../lib/ViewerScene'

const STORAGE_KEY = 'model-viewer:settings'

export interface ViewerSettings {
  wireframe: boolean
  autoRotate: boolean
  showGrid: boolean
  background: ViewerBackground
}

const DEFAULT_SETTINGS: ViewerSettings = { wireframe: false, autoRotate: false, showGrid: true, background: 'light' }

/** Display options of the viewer, remembered between visits. */
export function useViewerSettings() {
  const [stored, setStored] = useLocalStorage<Partial<ViewerSettings>>(STORAGE_KEY, DEFAULT_SETTINGS)
  const settings: ViewerSettings = { ...DEFAULT_SETTINGS, ...stored }
  const update = (changes: Partial<ViewerSettings>) => setStored((previous) => ({ ...DEFAULT_SETTINGS, ...previous, ...changes }))
  return [settings, update] as const
}
