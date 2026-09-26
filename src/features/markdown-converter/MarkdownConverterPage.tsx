import { useMemo } from 'react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { toFileName } from '../../lib/download'
import { MarkdownEditor } from './components/MarkdownEditor'
import { MarkdownPreview } from './components/MarkdownPreview'
import { SplitPane } from './components/SplitPane'
import { Toolbar } from './components/Toolbar'
import { useHtmlExport } from './hooks/useHtmlExport'
import { useMarkdownDocument } from './hooks/useMarkdownDocument'
import { useMarkdownParser } from './hooks/useMarkdownParser'
import { usePdfExport } from './hooks/usePdfExport'
import { extractTitle } from './lib/extractTitle'
import { parseMarkdown } from './lib/markdownParser'
import { createPrintableDocument } from './lib/printableDocument'

export default function MarkdownConverterPage() {
  useDocumentTitle('Markdown to PDF & HTML')

  const { markdown, setMarkdown, resetToSample, saveStatus } = useMarkdownDocument()
  const previewHtml = useMarkdownParser(markdown)
  const title = useMemo(() => extractTitle(markdown), [markdown])
  const { exportPdf, isExporting, error: pdfError } = usePdfExport()
  const { exportHtml } = useHtmlExport()

  // Exports parse the latest source directly so they never use a stale, debounced preview.
  const handleExportPdf = () => {
    void exportPdf(createPrintableDocument(parseMarkdown(markdown)), toFileName(title, 'pdf'))
  }

  const handleExportHtml = () => {
    exportHtml({ title, sanitizedHtml: parseMarkdown(markdown) })
  }

  const handleReset = () => {
    if (window.confirm('Replace your current text with the sample document? This cannot be undone.')) {
      resetToSample()
    }
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <Toolbar
        title={title}
        saveStatus={saveStatus}
        isExportingPdf={isExporting}
        onExportPdf={handleExportPdf}
        onExportHtml={handleExportHtml}
        onReset={handleReset}
      />
      {pdfError && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {pdfError}
        </p>
      )}
      <SplitPane
        leftLabel="Editor"
        rightLabel="Preview"
        left={<MarkdownEditor value={markdown} onChange={setMarkdown} />}
        right={<MarkdownPreview sanitizedHtml={previewHtml} />}
      />
    </div>
  )
}
