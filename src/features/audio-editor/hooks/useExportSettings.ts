import { useMemo } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { DEFAULT_EXPORT_SETTINGS, sanitizeExportSettings, type ExportSettings } from '../lib/outputFormats'

const STORAGE_KEY = 'tool-box:audio-editor:export-settings'

/** The last used export settings, remembered in this browser. */
export function useExportSettings() {
  const [stored, setStored] = useLocalStorage<ExportSettings>(STORAGE_KEY, DEFAULT_EXPORT_SETTINGS)
  const settings = useMemo(() => sanitizeExportSettings(stored), [stored])
  return [settings, setStored] as const
}
