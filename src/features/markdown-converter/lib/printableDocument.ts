/**
 * Builds a detached element for PDF rendering. It uses the same document
 * styles as the preview but is independent of the preview's scroll area and
 * width, and wraps long code lines instead of clipping them.
 */
export function createPrintableDocument(sanitizedHtml: string): HTMLElement {
  const article = document.createElement('article')
  article.className = 'markdown-body markdown-body--print'
  article.innerHTML = sanitizedHtml
  return article
}
