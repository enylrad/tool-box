import { useEffect, useState } from 'react'
import { openPdf, releaseCanvas, renderPage } from '../lib/pdfDocument'

const PREVIEW_WIDTH_PX = 900

interface PdfPreview {
  file: File
  /** Object URL of the first page rendered as an image, or null if it could not be rendered. */
  imageUrl: string | null
  pageCount: number | null
}

function canvasToBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not encode the preview'))), 'image/png')
  })
}

/** Renders the first page of a PDF as a preview image and reads its page count. */
export function usePdfPreview(file: File | null) {
  const [preview, setPreview] = useState<PdfPreview | null>(null)

  useEffect(() => {
    if (!file) return
    let isCurrent = true
    let imageUrl: string | null = null

    const render = async () => {
      const pdf = await openPdf(file)
      try {
        const page = await pdf.getPage(1)
        const baseViewport = page.getViewport({ scale: 1 })
        const canvas = await renderPage(page, PREVIEW_WIDTH_PX / baseViewport.width)
        const blob = await canvasToBlob(canvas)
        releaseCanvas(canvas)
        if (!isCurrent) return
        imageUrl = URL.createObjectURL(blob)
        setPreview({ file, imageUrl, pageCount: pdf.numPages })
      } finally {
        void pdf.loadingTask.destroy()
      }
    }

    render().catch((cause) => {
      console.error('PDF preview failed', cause)
      if (isCurrent) setPreview({ file, imageUrl: null, pageCount: null })
    })

    return () => {
      isCurrent = false
      if (imageUrl) URL.revokeObjectURL(imageUrl)
    }
  }, [file])

  // Ignore a preview that belongs to a previously selected file.
  const current = preview && preview.file === file ? preview : null
  return { imageUrl: current?.imageUrl ?? null, pageCount: current?.pageCount ?? null, isLoading: file !== null && !current }
}
