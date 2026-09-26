import { useCallback } from 'react'
import { downloadBlob, toFileName } from '../../../lib/download'
import { EXPORT_CSS } from '../lib/exportStyles'
import { buildHtmlDocument } from '../lib/htmlTemplate'

interface HtmlExportInput {
  title: string
  sanitizedHtml: string
}

/** Downloads sanitized HTML as a standalone, self-styled .html file. */
export function useHtmlExport() {
  const exportHtml = useCallback(({ title, sanitizedHtml }: HtmlExportInput) => {
    const documentHtml = buildHtmlDocument({ title, bodyHtml: sanitizedHtml, css: EXPORT_CSS })
    const blob = new Blob([documentHtml], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, toFileName(title, 'html'))
  }, [])

  return { exportHtml }
}
