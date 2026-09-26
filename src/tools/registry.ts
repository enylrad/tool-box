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
    id: 'qr-generator',
    path: '/qr-code-generator',
    name: 'QR Code Generator',
    description:
      'Create vector QR codes for links, Wi-Fi, contacts, email, SMS or phone calls, with custom colors, logo and silhouette shapes. Export as SVG or PNG.',
    component: lazy(() => import('../features/qr-generator/QrGeneratorPage')),
  },
  {
    id: 'word-counter',
    path: '/word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, sentences and paragraphs as you type, and see the estimated reading time.',
    component: lazy(() => import('../features/word-counter/WordCounterPage')),
  },
  {
    id: 'image-ocr',
    path: '/image-to-text',
    name: 'Image to Text (OCR)',
    description: 'Extract text from images in English or Spanish with Tesseract OCR. Drop, pick or paste an image.',
    component: lazy(() => import('../features/image-ocr/ImageOcrPage')),
  },
  {
    id: 'video-converter',
    path: '/video-converter',
    name: 'Video Editor & Converter',
    description: 'Trim, crop, rotate or flip a video and convert it to MP4, WebM, MOV, MKV, AVI, GIF, MP3 or WAV.',
    component: lazy(() => import('../features/video-converter/VideoConverterPage')),
  },
]
