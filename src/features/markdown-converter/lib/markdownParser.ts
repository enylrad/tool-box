import DOMPurify from 'dompurify'
import hljs from 'highlight.js/lib/common'
import { Marked } from 'marked'
import { markedHighlight } from 'marked-highlight'

const marked = new Marked(
  markedHighlight({
    emptyLangClass: 'hljs',
    langPrefix: 'hljs language-',
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : 'plaintext'
      return hljs.highlight(code, { language }).value
    },
  }),
  { gfm: true },
)

// A dedicated instance so the hook below does not leak into other DOMPurify users.
const purifier = DOMPurify()

// External links open in a new tab so clicking them never navigates away from the editor.
purifier.addHook('afterSanitizeAttributes', (node) => {
  if (node.tagName !== 'A') return
  const href = node.getAttribute('href') ?? ''
  if (/^https?:\/\//i.test(href)) {
    node.setAttribute('target', '_blank')
    node.setAttribute('rel', 'noopener noreferrer')
  }
})

/** Converts Markdown into HTML that is safe to inject into the DOM. */
export function parseMarkdown(markdown: string): string {
  const unsafeHtml = marked.parse(markdown, { async: false })
  return purifier.sanitize(unsafeHtml, { ADD_ATTR: ['target'] })
}
