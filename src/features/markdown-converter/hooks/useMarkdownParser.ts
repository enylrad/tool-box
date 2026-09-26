import { useMemo } from 'react'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { parseMarkdown } from '../lib/markdownParser'

const PREVIEW_DEBOUNCE_MS = 150

/** Sanitized HTML for `markdown`, recomputed shortly after the user stops typing. */
export function useMarkdownParser(markdown: string): string {
  const debouncedMarkdown = useDebouncedValue(markdown, PREVIEW_DEBOUNCE_MS)
  return useMemo(() => parseMarkdown(debouncedMarkdown), [debouncedMarkdown])
}
