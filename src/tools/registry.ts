import { lazy, type ComponentType, type LazyExoticComponent } from 'react'

export type ToolCategory = 'images' | 'documents' | 'media' | '3d-maps' | 'utilities'

/** Home page sections, in display order. */
export const TOOL_CATEGORIES: { id: ToolCategory; name: string }[] = [
  { id: 'images', name: 'Images' },
  { id: 'documents', name: 'Documents & text' },
  { id: 'media', name: 'Audio & video' },
  { id: '3d-maps', name: '3D & maps' },
  { id: 'utilities', name: 'Utilities' },
]

export interface ToolDefinition {
  /** Stable identifier, also used as a prefix for the tool's storage keys. */
  id: string
  /** Route path, e.g. `/markdown-to-pdf` → `#/markdown-to-pdf`. */
  path: string
  name: string
  description: string
  /** Home page section the tool is listed in. */
  category: ToolCategory
  /** Each tool is code-split so visiting one tool does not download the others. */
  component: LazyExoticComponent<ComponentType>
}

/** Every tool in the site, grouped by category. Add an entry here to get a home page card and a route. */
export const TOOLS: ToolDefinition[] = [
  {
    id: 'image-editor',
    path: '/image-editor',
    name: 'Image Cropper, Resizer & Watermarker',
    description:
      'Crop, resize and add a text watermark to an image, compare it before and after, and save it as PNG, JPEG or WebP.',
    category: 'images',
    component: lazy(() => import('../features/image-editor/ImageEditorPage')),
  },
  {
    id: 'icon-generator',
    path: '/icon-generator',
    name: 'Icon & Favicon Generator',
    description:
      'Turn one image into every app icon and favicon size for Android, iOS, the web and Windows, and download them as a ready-to-use ZIP.',
    category: 'images',
    component: lazy(() => import('../features/icon-generator/IconGeneratorPage')),
  },
  {
    id: 'photo-metadata',
    path: '/photo-metadata',
    name: 'Photo Metadata Viewer',
    description:
      'See everything hidden in a photo — camera, exposure, dates, GPS location, editing and AI traces, raw EXIF/XMP/IPTC/ICC — and remove it before sharing.',
    category: 'images',
    component: lazy(() => import('../features/photo-metadata/PhotoMetadataPage')),
  },
  {
    id: 'qr-generator',
    path: '/qr-code-generator',
    name: 'QR Code Generator',
    description:
      'Create vector QR codes for links, Wi-Fi, contacts, email, SMS or phone calls, with custom colors, logo and silhouette shapes. Export as SVG or PNG.',
    category: 'images',
    component: lazy(() => import('../features/qr-generator/QrGeneratorPage')),
  },
  {
    id: 'markdown-converter',
    path: '/markdown-to-pdf',
    name: 'Markdown to PDF & HTML',
    description: 'Write Markdown with a live preview and export it as a paginated PDF or a clean, standalone HTML file.',
    category: 'documents',
    component: lazy(() => import('../features/markdown-converter/MarkdownConverterPage')),
  },
  {
    id: 'word-counter',
    path: '/word-counter',
    name: 'Word Counter',
    description: 'Count words, characters, sentences and paragraphs as you type, and see the estimated reading time.',
    category: 'documents',
    component: lazy(() => import('../features/word-counter/WordCounterPage')),
  },
  {
    id: 'image-ocr',
    path: '/image-to-text',
    name: 'Image & PDF to Text (OCR)',
    description:
      'Extract text from images and PDFs in English or Spanish. PDF text is read directly; scanned pages go through Tesseract OCR.',
    category: 'documents',
    component: lazy(() => import('../features/image-ocr/ImageOcrPage')),
  },
  {
    id: 'video-converter',
    path: '/video-converter',
    name: 'Video Editor & Converter',
    description: 'Trim, crop, rotate or flip a video and convert it to MP4, WebM, MOV, MKV, AVI, GIF, MP3 or WAV.',
    category: 'media',
    component: lazy(() => import('../features/video-converter/VideoConverterPage')),
  },
  {
    id: 'audio-editor',
    path: '/audio-editor',
    name: 'Audio Editor & Converter',
    description: 'Trim, cut, fade, normalize and adjust the volume of audio files, then convert them to MP3, WAV, FLAC, M4A, OGG or WebM.',
    category: 'media',
    component: lazy(() => import('../features/audio-editor/AudioEditorPage')),
  },
  {
    id: 'model-viewer',
    path: '/3d-model-viewer',
    name: '3D Model Viewer',
    description: 'Drop an OBJ, glTF, GLB or STL file to view it in 3D: orbit, zoom, wireframe, animations and model stats.',
    category: '3d-maps',
    component: lazy(() => import('../features/model-viewer/ModelViewerPage')),
  },
  {
    id: 'gpx-analyzer',
    path: '/gpx-analyzer',
    name: 'GPX Route & Elevation Analyzer',
    description: 'Open a GPX file to see the route in 2D and 3D, its elevation profile, total ascent and descent, grades and climbs.',
    category: '3d-maps',
    component: lazy(() => import('../features/gpx-analyzer/GpxAnalyzerPage')),
  },
  {
    id: 'password-generator',
    path: '/password-generator',
    name: 'Password Generator',
    description:
      'Generate strong random passwords with the Web Crypto API. Choose the length and character types; nothing leaves your device.',
    category: 'utilities',
    component: lazy(() => import('../features/password-generator/PasswordGeneratorPage')),
  },
]
