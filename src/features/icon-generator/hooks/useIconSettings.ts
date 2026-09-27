import { useCallback, useMemo } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { toSafeHexColor } from '../../../lib/color'
import { clampPadding } from '../lib/layout'
import type { Platform } from '../lib/platforms'
import type { IconAppearance } from '../lib/render'

const STORAGE_KEY = 'tool-box:icon-generator:settings'

export interface IconSettings extends IconAppearance {
  platforms: Record<Platform, boolean>
  appName: string
  shortName: string
  themeColor: string
}

const DEFAULT_APPEARANCE: IconAppearance = {
  transparentBackground: true,
  backgroundColor: '#ffffff',
  shape: 'square',
  padding: 0,
}

export const DEFAULT_SETTINGS: IconSettings = {
  ...DEFAULT_APPEARANCE,
  platforms: { android: true, ios: true, web: true, windows: true },
  appName: 'My App',
  shortName: '',
  themeColor: '#0f172a',
}

/** Output settings of the icon generator, persisted in the browser. */
export function useIconSettings() {
  const [stored, setStored] = useLocalStorage<IconSettings>(STORAGE_KEY, DEFAULT_SETTINGS)

  const settings = useMemo<IconSettings>(
    () => ({
      ...DEFAULT_SETTINGS,
      ...stored,
      platforms: { ...DEFAULT_SETTINGS.platforms, ...stored.platforms },
      backgroundColor: toSafeHexColor(stored.backgroundColor, DEFAULT_SETTINGS.backgroundColor),
      themeColor: toSafeHexColor(stored.themeColor, DEFAULT_SETTINGS.themeColor),
      padding: clampPadding(stored.padding),
    }),
    [stored],
  )

  const updateSettings = useCallback(
    (patch: Partial<IconSettings>) => setStored((previous) => ({ ...previous, ...patch })),
    [setStored],
  )

  const setPlatform = useCallback(
    (platform: Platform, enabled: boolean) =>
      setStored((previous) => ({ ...previous, platforms: { ...DEFAULT_SETTINGS.platforms, ...previous.platforms, [platform]: enabled } })),
    [setStored],
  )

  const resetAppearance = useCallback(() => setStored((previous) => ({ ...previous, ...DEFAULT_APPEARANCE })), [setStored])

  return { settings, updateSettings, setPlatform, resetAppearance }
}
