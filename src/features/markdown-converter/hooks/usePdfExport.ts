import { useCallback, useRef, useState } from 'react'

const PAGE_MARGIN_MM = 15

/**
 * html2canvas measures text baselines with a temporary <img>. Tailwind's reset
 * (`img { display: block }`) breaks that measurement and draws every line of
 * text a few pixels too low, so the reset is undone while a PDF is rendered.
 */
function applyRenderingFixes(): () => void {
  const style = document.createElement('style')
  style.textContent = 'img { display: inline-block; }'
  document.head.appendChild(style)
  return () => style.remove()
}

/**
 * Renders an element to a paginated A4 PDF and downloads it.
 * html2pdf.js is loaded on demand because it is by far the largest dependency.
 */
export function usePdfExport() {
  const [isExporting, setIsExporting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isRunningRef = useRef(false)

  const exportPdf = useCallback(async (element: HTMLElement, fileName: string) => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    setIsExporting(true)
    setError(null)
    const removeRenderingFixes = applyRenderingFixes()

    try {
      const { default: html2pdf } = await import('html2pdf.js')
      await html2pdf()
        .set({
          margin: PAGE_MARGIN_MM,
          filename: fileName,
          image: { type: 'jpeg', quality: 0.98 },
          enableLinks: true,
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' },
          // Not part of the bundled type definitions, but supported by html2pdf.js.
          pagebreak: {
            mode: ['css', 'legacy'],
            avoid: ['pre', 'blockquote', 'tr', 'img', 'h1', 'h2', 'h3', 'h4'],
          },
        } as Parameters<InstanceType<typeof html2pdf.Worker>['set']>[0])
        .from(element)
        .save()
    } catch (cause) {
      console.error('PDF export failed', cause)
      setError('Could not generate the PDF. Please try again.')
    } finally {
      removeRenderingFixes()
      isRunningRef.current = false
      setIsExporting(false)
    }
  }, [])

  return { exportPdf, isExporting, error }
}
