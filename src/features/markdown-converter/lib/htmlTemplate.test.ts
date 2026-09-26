import { describe, expect, it } from 'vitest'
import { buildHtmlDocument, escapeHtml } from './htmlTemplate'

describe('escapeHtml', () => {
  it('escapes HTML special characters', () => {
    expect(escapeHtml(`<a href="x">'&'</a>`)).toBe('&lt;a href=&quot;x&quot;&gt;&#39;&amp;&#39;&lt;/a&gt;')
  })
})

describe('buildHtmlDocument', () => {
  const document = buildHtmlDocument({
    title: '</title><script>alert(1)</script>',
    bodyHtml: '<p>Hello</p>',
    css: '.markdown-body { color: red; }',
  })

  it('produces a complete HTML5 document', () => {
    expect(document.startsWith('<!doctype html>')).toBe(true)
    expect(document).toContain('<meta charset="utf-8">')
    expect(document).toContain('<meta name="viewport"')
    expect(document).toContain('<article class="markdown-body">\n<p>Hello</p>\n</article>')
  })

  it('inlines the provided styles', () => {
    expect(document).toContain('.markdown-body { color: red; }')
  })

  it('escapes the title', () => {
    expect(document).toContain('<title>&lt;/title&gt;&lt;script&gt;alert(1)&lt;/script&gt;</title>')
    expect(document).not.toContain('<script>')
  })
})
