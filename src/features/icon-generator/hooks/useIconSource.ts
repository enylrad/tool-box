import { useEffect, useMemo, useState } from 'react'
import { useImageFile } from '../../../hooks/useImageFile'
import type { IconSource } from '../lib/render'
import { dataUrlToText, isSvgDataUrl, withIntrinsicSize } from '../lib/svg'

const MAX_BYTES = 20 * 1024 * 1024
/** The largest icon generated (iOS App Store) is 1024 px. */
export const RECOMMENDED_MIN_SIZE = 1024

interface PreparedSvg {
  dataUrl: string
  source: IconSource | null
  svgText: string | null
  error: string | null
}

async function prepareSvg(dataUrl: string): Promise<PreparedSvg> {
  const svgText = dataUrlToText(dataUrl)
  const { svg, width, height } = withIntrinsicSize(svgText)
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()
  return { dataUrl, source: { image, width, height, isVector: true }, svgText, error: null }
}

/** The uploaded image, ready to be rasterized at every icon size. */
export function useIconSource() {
  const file = useImageFile({ maxBytes: MAX_BYTES })
  const [preparedSvg, setPreparedSvg] = useState<PreparedSvg | null>(null)
  const image = file.image
  const isSvg = Boolean(image && isSvgDataUrl(image.dataUrl))

  useEffect(() => {
    if (!image || !isSvgDataUrl(image.dataUrl)) return
    let isCancelled = false
    prepareSvg(image.dataUrl).then(
      (prepared) => {
        if (!isCancelled) setPreparedSvg(prepared)
      },
      (error: unknown) => {
        console.error('SVG could not be prepared', error)
        if (!isCancelled) setPreparedSvg({ dataUrl: image.dataUrl, source: null, svgText: null, error: 'This SVG image could not be read.' })
      },
    )
    return () => {
      isCancelled = true
    }
  }, [image])

  return useMemo(() => {
    const base = { image, isVector: isSvg, load: file.load, clear: file.clear }
    if (!image) return { ...base, source: null, svgText: null, isPreparing: false, warning: null, error: file.error }

    if (isSvg) {
      const prepared = preparedSvg?.dataUrl === image.dataUrl ? preparedSvg : null
      return {
        ...base,
        source: prepared?.source ?? null,
        svgText: prepared?.svgText ?? null,
        isPreparing: !prepared,
        warning: null,
        error: file.error ?? prepared?.error ?? null,
      }
    }

    const { naturalWidth: width, naturalHeight: height } = image.element
    const source: IconSource = { image: image.element, width, height, isVector: false }
    const warnings: string[] = []
    if (Math.min(width, height) < RECOMMENDED_MIN_SIZE) {
      warnings.push(`The image is ${width}×${height} px. Use at least ${RECOMMENDED_MIN_SIZE}×${RECOMMENDED_MIN_SIZE} px (or an SVG) so the largest icons stay sharp.`)
    }
    if (width !== height) warnings.push('The image is not square: it is centered and fitted inside each icon.')
    return { ...base, source, svgText: null, isPreparing: false, warning: warnings.join(' ') || null, error: file.error }
  }, [image, isSvg, preparedSvg, file.load, file.clear, file.error])
}
