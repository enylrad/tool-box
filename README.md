# Tool Box

A collection of handy tools that run **entirely in your browser**. Nothing is uploaded to a server, and after the first visit the site keeps working offline (it is an installable PWA).

**Live site:** https://enylrad.github.io/tool-box/

## Tools

| Tool | Route | What it does |
| --- | --- | --- |
| Markdown to PDF & HTML | `#/markdown-to-pdf` | Markdown editor with live preview, syntax highlighting, PDF export and standalone HTML export. Text is auto-saved in the browser. |
| QR Code Generator | `#/qr-code-generator` | Vector QR codes for text/URLs, Wi-Fi, contacts (vCard), email, SMS and phone calls. Custom colors, square/rounded/dot modules, center logo and silhouette shapes from any image. Export as SVG or PNG, or copy the SVG code. |
| Word Counter | `#/word-counter` | Real-time count of words, characters (with and without spaces), sentences, paragraphs and lines, plus estimated reading and speaking time. Works with any language and is auto-saved in the browser. |
| Image & PDF to Text (OCR) | `#/image-to-text` | Extracts text from an image or a PDF (picked, dropped or pasted with Ctrl+V) in English, Spanish or both. PDF pages with embedded text are read directly with pdf.js; scanned pages go through Tesseract.js OCR, with per-page progress and a Cancel button. The text can be edited, copied or downloaded as `.txt`. |

## Getting started

Requirements: [Node.js](https://nodejs.org) 22 or newer (it includes `npm`).

```bash
npm install      # download dependencies (like a Gradle sync)
npm run dev      # start a dev server with hot reload → http://localhost:5173/tool-box/
```

Other commands:

| Command | Purpose |
| --- | --- |
| `npm run build` | Type-check and produce the production site in `dist/` |
| `npm run preview` | Serve the `dist/` build locally (the service worker only runs here, not in `dev`) |
| `npm test` | Run unit tests in watch mode (`npm test -- --run` runs once) |
| `npm run lint` | Run ESLint |

## Deployment

Every push to `main` runs [`.github/workflows/deploy.yml`](.github/workflows/deploy.yml): it installs dependencies, lints, tests, builds and publishes `dist/` to GitHub Pages.

One-time setup: in the repository go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.

## Project structure

A quick map for Android developers:

| Web | Android equivalent |
| --- | --- |
| `package.json` | `build.gradle` (dependencies and tasks) |
| `vite.config.ts` | Gradle plugins / build configuration |
| React component (`*.tsx`) | A `@Composable` function |
| React hook (`useSomething`) | ViewModel / use-case logic that a composable consumes |
| `src/tools/registry.ts` | Navigation graph |
| `localStorage` | `SharedPreferences` |

```
src/
├── main.tsx                 # Entry point (like Application + MainActivity)
├── App.tsx                  # Routes, generated from the tool registry
├── index.css                # Tailwind CSS entry
├── tools/registry.ts        # List of every tool (name, route, lazy-loaded page)
├── components/              # Shared UI: Layout, HomePage, Button, Panel, SplitPane
│   └── form/                # Shared form controls: TextInput, Select, ColorInput, Slider, FileDrop…
├── hooks/                   # Shared hooks: useLocalStorage, useDebouncedValue, useClipboard, useImageFile…
├── lib/                     # Shared pure functions: file downloads, colors
└── features/
    ├── markdown-converter/
    │   ├── MarkdownConverterPage.tsx   # Screen: wires hooks to components
    │   ├── components/                 # Toolbar, editor, preview
    │   ├── hooks/                      # useMarkdownDocument, useMarkdownParser, usePdfExport, useHtmlExport
    │   ├── lib/                        # Pure logic: parser + sanitizer, HTML template, title extraction
    │   └── styles/document.css         # Document styles shared by preview, PDF and HTML export
    ├── qr-generator/
    │   ├── QrGeneratorPage.tsx         # Screen: controls on the left, live preview + export on the right
    │   ├── components/                 # Content forms, style/logo/silhouette panels, preview, export bar
    │   ├── hooks/                      # useQrContent, useQrStyle, useShapeMask, useQrCode, useQrExport
    │   └── lib/                        # Pure logic: payload encoders, QR matrix, layout, silhouette mask, SVG renderer
    ├── word-counter/
    │   ├── WordCounterPage.tsx         # Screen: text area + live statistics
    │   ├── components/                 # StatsPanel, StatCard
    │   ├── hooks/                      # useWordCounterText (auto-saved text and reading speed)
    │   └── lib/                        # Pure logic: text statistics, reading time
    └── image-ocr/
        ├── ImageOcrPage.tsx            # Screen: wires hooks to components
        ├── components/                 # Toolbar, file drop zone, extracted text output
        ├── hooks/                      # useTextExtraction (image/PDF pipeline), useOcrWorker, usePdfPreview, useSourceFile
        └── lib/                        # Pure logic: PDF text/page helpers, progress, asset URLs, file types; pdf.js loader
scripts/
└── copy-ocr-assets.mjs         # Copies the OCR engine, language data and pdf.js into public/
```

The rule of thumb: **components** only render, **hooks** hold state and side effects, **lib** holds pure, unit-tested functions.

### OCR assets

Tesseract.js and pdf.js normally download their workers, WebAssembly engines and data (languages, fonts, CMaps) from a CDN. To keep the site offline and private, `scripts/copy-ocr-assets.mjs` copies them from `node_modules` into `public/tesseract/` and `public/pdfjs/` (both git-ignored). It runs automatically before `npm run dev` and `npm run build`. These files (~22 MB, of which a browser only downloads the ~4 MB OCR engine variant it supports, the chosen languages and the pdf.js files a PDF actually needs) are not precached; the service worker caches them the first time the OCR tool uses them, so it works offline afterwards. pdf.js is imported from its `legacy` build, which polyfills recent JavaScript features that current browsers may still lack. To add a language, install its `@tesseract.js-data/<code>` package and add the code to the script and to `src/features/image-ocr/lib/ocrLanguages.ts`.

## Adding a new tool

1. Create `src/features/<tool-name>/` with a page component exported as `default` (for example `JsonFormatterPage.tsx`), plus `components/`, `hooks/` and `lib/` folders as needed.
2. Register it in `src/tools/registry.ts`:
   ```ts
   {
     id: 'json-formatter',
     path: '/json-formatter',
     name: 'JSON Formatter',
     description: 'Format and validate JSON.',
     component: lazy(() => import('../features/json-formatter/JsonFormatterPage')),
   },
   ```
   The home page card and the route are created automatically.
3. Keep it offline: bundle libraries with `npm install` instead of loading them from a CDN, and never send user data to a server.
4. Put pure logic in `lib/` and cover it with `*.test.ts` files next to it.

## Tech stack

[Vite](https://vite.dev) · [React](https://react.dev) · TypeScript · [Tailwind CSS](https://tailwindcss.com) · [React Router](https://reactrouter.com) (hash routing, so reloading a tool URL works on GitHub Pages) · [vite-plugin-pwa](https://vite-pwa-org.netlify.app) · [marked](https://marked.js.org) · [DOMPurify](https://github.com/cure53/DOMPurify) · [highlight.js](https://highlightjs.org) · [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) · [node-qrcode](https://github.com/soldair/node-qrcode) · [Tesseract.js](https://tesseract.projectnaptha.com) · [pdf.js](https://mozilla.github.io/pdf.js/) · [Vitest](https://vitest.dev) + [jsQR](https://github.com/cozmo/jsQR) (tests decode every generated QR code)
