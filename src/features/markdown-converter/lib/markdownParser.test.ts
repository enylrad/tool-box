import { describe, expect, it } from 'vitest'
import { parseMarkdown } from './markdownParser'

describe('parseMarkdown', () => {
  it('renders GitHub-flavored Markdown', () => {
    const html = parseMarkdown('# Title\n\n| a | b |\n| - | - |\n| 1 | 2 |')
    expect(html).toContain('<h1>Title</h1>')
    expect(html).toContain('<table>')
  })

  it('highlights fenced code blocks', () => {
    const html = parseMarkdown('```js\nconst answer = 42\n```')
    expect(html).toContain('class="hljs language-js"')
    expect(html).toContain('<span class="hljs-keyword">const</span>')
  })

  it('falls back to plain text for unknown languages', () => {
    const html = parseMarkdown('```not-a-language\nhello\n```')
    expect(html).toContain('hello')
  })

  it('removes script tags and inline event handlers', () => {
    const html = parseMarkdown('<script>alert(1)</script>\n\n<img src="x" onerror="alert(1)">')
    expect(html).not.toContain('<script')
    expect(html).not.toContain('onerror')
  })

  it('removes javascript: URLs', () => {
    const html = parseMarkdown('[click](javascript:alert(1))')
    expect(html).not.toContain('javascript:')
  })

  it('opens external links in a new tab safely', () => {
    const html = parseMarkdown('[site](https://example.com)')
    expect(html).toContain('target="_blank"')
    expect(html).toContain('rel="noopener noreferrer"')
  })

  it('keeps in-page anchors in the same tab', () => {
    const html = parseMarkdown('[section](#section)')
    expect(html).not.toContain('target=')
  })
})
