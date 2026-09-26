const FIRST_HEADING = /^\s{0,3}#{1,6}\s+(.+?)\s*#*\s*$/m

/** Returns the text of the first Markdown heading, or `fallback` if there is none. */
export function extractTitle(markdown: string, fallback = 'Document'): string {
  const match = FIRST_HEADING.exec(markdown)
  if (!match) return fallback
  const plainText = match[1]
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1') // links and images → their text
    .replace(/[*_`~]/g, '') // inline emphasis markers
    .trim()
  return plainText || fallback
}
