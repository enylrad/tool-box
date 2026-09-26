import { useCallback, useMemo } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import type { ErrorCorrectionLevel } from '../lib/qrMatrix'
import type { ModuleShape } from '../lib/svgRenderer'

const STORAGE_KEY = 'tool-box:qr-generator:style'

export interface QrStyleSettings {
  foreground: string
  background: string
  transparentBackground: boolean
  moduleShape: ModuleShape
  errorCorrection: ErrorCorrectionLevel
  /** Quiet zone in modules. */
  margin: number
  /** Logo width relative to the code width (0.1–0.3). */
  logoSize: number
  /** Silhouette width relative to the code width. */
  shapeScale: number
  /** Share of silhouette cells filled with decorative modules. */
  shapeDensity: number
  shapeInvert: boolean
}

export const DEFAULT_STYLE: QrStyleSettings = {
  foreground: '#0f172a',
  background: '#ffffff',
  transparentBackground: false,
  moduleShape: 'square',
  errorCorrection: 'M',
  margin: 4,
  logoSize: 0.22,
  shapeScale: 2,
  shapeDensity: 0.5,
  shapeInvert: false,
}

/** Visual settings of the QR code, persisted in the browser. */
export function useQrStyle() {
  const [stored, setStored] = useLocalStorage<QrStyleSettings>(STORAGE_KEY, DEFAULT_STYLE)
  const style = useMemo<QrStyleSettings>(() => ({ ...DEFAULT_STYLE, ...stored }), [stored])

  const updateStyle = useCallback(
    (patch: Partial<QrStyleSettings>) => setStored((previous) => ({ ...previous, ...patch })),
    [setStored],
  )

  const resetStyle = useCallback(() => setStored(DEFAULT_STYLE), [setStored])

  return { style, updateStyle, resetStyle }
}
