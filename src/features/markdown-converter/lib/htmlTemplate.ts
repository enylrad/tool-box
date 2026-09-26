interface HtmlDocumentOptions {
  title: string
  bodyHtml: string
  css: string
  lang?: string
}

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export function escapeHtml(text: string): string {
  return text.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])
}

// Page-level layout for the standalone file; typography comes from `css`.
const PAGE_LAYOUT_CSS = `
body { margin: 0; background: #ffffff; }
.markdown-body { box-sizing: border-box; max-width: 860px; margin: 0 auto; padding: 48px 24px; }
@media print { .markdown-body { max-width: none; padding: 0; } }
`

/**
 * Wraps already-sanitized HTML in a minimal, self-contained HTML5 document.
 * All styles are inlined so the file renders correctly offline.
 */
export function buildHtmlDocument({ title, bodyHtml, css, lang = 'en' }: HtmlDocumentOptions): string {
  return `<!doctype html>
<html lang="${escapeHtml(lang)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
${css.trim()}
${PAGE_LAYOUT_CSS.trim()}
</style>
</head>
<body>
<article class="markdown-body">
${bodyHtml.trim()}
</article>
</body>
</html>
`
}
