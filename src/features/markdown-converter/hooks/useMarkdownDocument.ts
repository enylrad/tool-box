import { useCallback } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { SAMPLE_MARKDOWN } from '../lib/sampleMarkdown'

const STORAGE_KEY = 'tool-box:markdown-converter:content'

/** The user's Markdown source, auto-saved to localStorage. */
export function useMarkdownDocument() {
  const [markdown, setMarkdown, saveStatus] = useLocalStorage(STORAGE_KEY, SAMPLE_MARKDOWN)

  const resetToSample = useCallback(() => setMarkdown(SAMPLE_MARKDOWN), [setMarkdown])

  return { markdown, setMarkdown, resetToSample, saveStatus }
}
