import { useCallback, useMemo } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { toSafeHexColor } from '../../../lib/color'
import { DEFAULT_OUTPUT, OUTPUT_FORMAT_IDS, type OutputSettings } from '../lib/output'
import { DEFAULT_RESIZE, MAX_PERCENT, MAX_SIDE, clampInteger, type ResizeMode, type ResizeSettings } from '../lib/resize'
import { DEFAULT_WATERMARK, WATERMARK_POSITIONS, type WatermarkSettings } from '../lib/watermark'

const STORAGE_KEY = 'tool-box:image-editor:settings'

export interface EditorSettings {
  resize: ResizeSettings
  watermark: WatermarkSettings
  output: OutputSettings
}

const DEFAULT_SETTINGS: EditorSettings = { resize: DEFAULT_RESIZE, watermark: DEFAULT_WATERMARK, output: DEFAULT_OUTPUT }

const RESIZE_MODES: readonly ResizeMode[] = ['original', 'percent', 'custom']

const clampNumber = (value: unknown, min: number, max: number, fallback: number) =>
  typeof value === 'number' && Number.isFinite(value) ? Math.min(Math.max(value, min), max) : fallback

const oneOf = <T>(value: unknown, allowed: readonly T[], fallback: T): T => (allowed.includes(value as T) ? (value as T) : fallback)

/** Rebuilds valid settings from whatever is in storage (it may be old or edited by hand). */
function sanitize(stored: Partial<EditorSettings>): EditorSettings {
  const resize: Partial<ResizeSettings> = stored.resize ?? {}
  const watermark: Partial<WatermarkSettings> = stored.watermark ?? {}
  const output: Partial<OutputSettings> = stored.output ?? {}
  return {
    resize: {
      mode: oneOf(resize.mode, RESIZE_MODES, DEFAULT_RESIZE.mode),
      percent: clampInteger(resize.percent, 1, MAX_PERCENT, DEFAULT_RESIZE.percent),
      width: clampInteger(resize.width, 1, MAX_SIDE, DEFAULT_RESIZE.width),
      height: clampInteger(resize.height, 1, MAX_SIDE, DEFAULT_RESIZE.height),
      keepAspect: typeof resize.keepAspect === 'boolean' ? resize.keepAspect : DEFAULT_RESIZE.keepAspect,
    },
    watermark: {
      enabled: typeof watermark.enabled === 'boolean' ? watermark.enabled : DEFAULT_WATERMARK.enabled,
      text: typeof watermark.text === 'string' ? watermark.text : DEFAULT_WATERMARK.text,
      color: toSafeHexColor(String(watermark.color), DEFAULT_WATERMARK.color),
      opacity: clampNumber(watermark.opacity, 0.05, 1, DEFAULT_WATERMARK.opacity),
      sizePercent: clampNumber(watermark.sizePercent, 1, 30, DEFAULT_WATERMARK.sizePercent),
      position: oneOf(watermark.position, WATERMARK_POSITIONS, DEFAULT_WATERMARK.position),
      marginPercent: clampNumber(watermark.marginPercent, 0, 20, DEFAULT_WATERMARK.marginPercent),
      tileSpacingPercent: clampNumber(watermark.tileSpacingPercent, 0, 50, DEFAULT_WATERMARK.tileSpacingPercent),
      tileAngle: clampNumber(watermark.tileAngle, -90, 90, DEFAULT_WATERMARK.tileAngle),
    },
    output: {
      format: oneOf(output.format, OUTPUT_FORMAT_IDS, DEFAULT_OUTPUT.format),
      quality: clampNumber(output.quality, 0.1, 1, DEFAULT_OUTPUT.quality),
    },
  }
}

/** Resize, watermark and export settings, remembered in the browser for the next image. */
export function useEditorSettings() {
  const [stored, setStored] = useLocalStorage<Partial<EditorSettings>>(STORAGE_KEY, DEFAULT_SETTINGS)
  const settings = useMemo(() => sanitize(stored), [stored])

  const updateResize = useCallback(
    (patch: Partial<ResizeSettings>) => setStored((previous) => ({ ...previous, resize: { ...sanitize(previous).resize, ...patch } })),
    [setStored],
  )
  const updateWatermark = useCallback(
    (patch: Partial<WatermarkSettings>) =>
      setStored((previous) => ({ ...previous, watermark: { ...sanitize(previous).watermark, ...patch } })),
    [setStored],
  )
  const updateOutput = useCallback(
    (patch: Partial<OutputSettings>) => setStored((previous) => ({ ...previous, output: { ...sanitize(previous).output, ...patch } })),
    [setStored],
  )
  const resetWatermark = useCallback(
    () => setStored((previous) => ({ ...previous, watermark: DEFAULT_WATERMARK })),
    [setStored],
  )

  return { settings, updateResize, updateWatermark, updateOutput, resetWatermark }
}
