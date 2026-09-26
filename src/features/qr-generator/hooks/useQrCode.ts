import { useMemo } from 'react'
import { contrastRatio, relativeLuminance, toSafeHexColor } from '../../../lib/color'
import { composeLayout } from '../lib/layout'
import { createQrMatrix, QrTooLongError, type ErrorCorrectionLevel } from '../lib/qrMatrix'
import { hashString } from '../lib/random'
import type { ShapeMask } from '../lib/shapeMask'
import { renderQrSvg } from '../lib/svgRenderer'
import type { QrStyleSettings } from './useQrStyle'

const MIN_CONTRAST_RATIO = 3
const MIN_SHAPE_COVERAGE = 0.15

interface QrCodeInput {
  payload: string
  style: QrStyleSettings
  logoDataUrl: string | null
  shapeMask: ShapeMask | null
}

export type QrCodeResult =
  | { status: 'empty' }
  | { status: 'error'; message: string }
  | {
      status: 'ready'
      svg: string
      version: number
      moduleCount: number
      errorCorrection: ErrorCorrectionLevel
      warnings: string[]
    }

function colorWarnings(style: QrStyleSettings): string[] {
  const foreground = toSafeHexColor(style.foreground, '#000000')
  const background = toSafeHexColor(style.background, '#ffffff')
  if (style.transparentBackground) {
    return relativeLuminance(foreground) > 0.5
      ? ['The code is light and the background is transparent: place it on a dark enough surface or it will not scan.']
      : []
  }
  const warnings: string[] = []
  if (contrastRatio(foreground, background) < MIN_CONTRAST_RATIO) {
    warnings.push('Low contrast between the code and the background: it may not scan.')
  }
  if (relativeLuminance(foreground) > relativeLuminance(background)) {
    warnings.push('Light code on a dark background: some scanners cannot read inverted codes.')
  }
  return warnings
}

/** Encodes, lays out and renders the QR code whenever its inputs change. */
export function useQrCode({ payload, style, logoDataUrl, shapeMask }: QrCodeInput): QrCodeResult {
  return useMemo<QrCodeResult>(() => {
    if (!payload) return { status: 'empty' }

    // A logo hides part of the code, so use the highest error correction.
    const errorCorrection: ErrorCorrectionLevel = logoDataUrl ? 'H' : style.errorCorrection
    try {
      const matrix = createQrMatrix(payload, errorCorrection)
      const layout = composeLayout(matrix, {
        margin: style.margin,
        logoSizeRatio: logoDataUrl ? style.logoSize : undefined,
        shape: shapeMask
          ? { mask: shapeMask, scale: style.shapeScale, density: style.shapeDensity, seed: hashString(payload) }
          : undefined,
      })
      const warnings = colorWarnings(style)
      if (layout.shapeCoverage !== null && layout.shapeCoverage < MIN_SHAPE_COVERAGE) {
        warnings.push('The silhouette barely shows around the code. Increase the shape size or use a bolder image.')
      }
      return {
        status: 'ready',
        svg: renderQrSvg(layout, style, logoDataUrl),
        version: matrix.version,
        moduleCount: matrix.size,
        errorCorrection,
        warnings,
      }
    } catch (error) {
      if (error instanceof QrTooLongError) {
        return {
          status: 'error',
          message: `${error.message} Shorten it${errorCorrection === 'L' ? '' : ' or lower the error correction level'}.`,
        }
      }
      throw error
    }
  }, [payload, style, logoDataUrl, shapeMask])
}
