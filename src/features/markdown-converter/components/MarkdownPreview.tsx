import 'highlight.js/styles/github.css'
import '../styles/document.css'

interface MarkdownPreviewProps {
  /** Must already be sanitized — it is injected as raw HTML. */
  sanitizedHtml: string
}

export function MarkdownPreview({ sanitizedHtml }: MarkdownPreviewProps) {
  return (
    <div className="h-full overflow-auto bg-slate-100 p-4 dark:bg-slate-900 sm:p-6">
      <article
        aria-label="Rendered preview"
        className="markdown-body mx-auto max-w-3xl rounded-lg p-6 shadow-sm ring-1 ring-slate-200 sm:p-10 dark:ring-slate-700"
        dangerouslySetInnerHTML={{ __html: sanitizedHtml }}
      />
    </div>
  )
}
