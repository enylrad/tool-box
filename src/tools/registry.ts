import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export interface ToolDefinition {
  /** Stable identifier, also used as a prefix for the tool's storage keys. */
  id: string
  /** Route path, e.g. `/markdown-to-pdf` → `#/markdown-to-pdf`. */
  path: string
  name: string
  description: string
  /** Each tool is code-split so visiting one tool does not download the others. */
  component: LazyExoticComponent<ComponentType>
}

/** Every tool in the site. Add an entry here to get a home page card and a route. */
export const TOOLS: ToolDefinition[] = [
  {
    id: 'markdown-converter',
    path: '/markdown-to-pdf',
    name: 'Markdown to PDF & HTML',
    description: 'Write Markdown with a live preview and export it as a paginated PDF or a clean, standalone HTML file.',
    component: lazy(() => import('../features/markdown-converter/MarkdownConverterPage')),
  },
  {
    id: 'audio-editor',
    path: '/audio-editor',
    name: 'Audio Editor & Converter',
    description: 'Trim, cut, fade, normalize and adjust the volume of audio files, then convert them to MP3, WAV, FLAC, M4A, OGG or WebM.',
    component: lazy(() => import('../features/audio-editor/AudioEditorPage')),
  },
]
