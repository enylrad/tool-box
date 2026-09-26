import { useCallback, useState } from 'react'
import { useClipboard } from '../../../hooks/useClipboard'
import { downloadBlob, toFileName } from '../../../lib/download'
import { svgToPngBlob } from '../lib/rasterize'

/** Download and clipboard actions for a rendered QR code SVG. */
export function useQrExport(svg: string | null, fileTitle: string) {
  const { copy, copied, error: copyError } = useClipboard()
  const [isExportingPng, setIsExportingPng] = useState(false)
  const [pngError, setPngError] = useState<string | null>(null)

  const downloadSvg = useCallback(() => {
    if (!svg) return
    downloadBlob(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }), toFileName(fileTitle, 'svg'))
  }, [svg, fileTitle])

  const downloadPng = useCallback(
    async (sizePx: number) => {
      if (!svg) return
      setIsExportingPng(true)
      setPngError(null)
      try {
        downloadBlob(await svgToPngBlob(svg, sizePx), toFileName(fileTitle, 'png'))
      } catch (error) {
        console.error('PNG export failed', error)
        setPngError('Could not create the PNG image.')
      } finally {
        setIsExportingPng(false)
      }
    },
    [svg, fileTitle],
  )

  const copySvg = useCallback(() => {
    if (svg) void copy(svg)
  }, [svg, copy])

  return { downloadSvg, downloadPng, copySvg, copied, isExportingPng, error: pngError ?? copyError }
}
