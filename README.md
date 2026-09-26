# Tool Box

A collection of handy tools that run **entirely in your browser**. Nothing is uploaded to a server, and after the first visit the site keeps working offline (it is an installable PWA).

**Live site:** https://enylrad.github.io/tool-box/

## Tools

| Tool | Route | What it does |
| --- | --- | --- |
| Markdown to PDF & HTML | `#/markdown-to-pdf` | Markdown editor with live preview, syntax highlighting, PDF export and standalone HTML export. Text is auto-saved in the browser. |
| Video Editor & Converter | `#/video-converter` | Trim, crop, rotate and flip a video with a live preview, then convert it to MP4, WebM, MOV, MKV, AVI, GIF, MP3 or WAV. Powered by ffmpeg compiled to WebAssembly; the video never leaves the device. |

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
├── components/              # Shared UI: Layout, HomePage, Button
├── hooks/                   # Shared hooks: useLocalStorage, useDebouncedValue, useDocumentTitle
├── lib/                     # Shared pure functions: file downloads, file names
└── features/
    └── markdown-converter/
        ├── MarkdownConverterPage.tsx   # Screen: wires hooks to components
        ├── components/                 # Toolbar, editor, preview, responsive split pane
        ├── hooks/                      # useMarkdownDocument, useMarkdownParser, usePdfExport, useHtmlExport
        ├── lib/                        # Pure logic: parser + sanitizer, HTML template, title extraction
        └── styles/document.css         # Document styles shared by preview, PDF and HTML export
    └── video-converter/
        ├── VideoConverterPage.tsx      # Screen: file picker, then the editor
        ├── components/                 # Preview with crop overlay, playback bar, trim/transform/format panels
        ├── hooks/                      # useFfmpeg (engine in a Web Worker), useVideoFile, useEditSettings, useVideoConversion
        └── lib/                        # Pure logic: ffmpeg arguments, formats, crop geometry, timecodes, log parsing
```

The rule of thumb: **components** only render, **hooks** hold state and side effects, **lib** holds pure, unit-tested functions.

### About the video engine

The video tool uses [ffmpeg.wasm](https://ffmpegwasm.netlify.app) with the **single-threaded** core, because GitHub Pages cannot send the COOP/COEP headers the multi-threaded build needs. The core (~31 MB of WebAssembly) is bundled with the site, downloaded only when the video tool is opened, and then cached by the service worker so it keeps working offline. Files are mounted read-only into the engine (WORKERFS), so the input is not copied into memory; the output still is, which is why very large files can fail. The ffmpeg core is licensed under the GPL (it includes x264).

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

[Vite](https://vite.dev) · [React](https://react.dev) · TypeScript · [Tailwind CSS](https://tailwindcss.com) · [React Router](https://reactrouter.com) (hash routing, so reloading a tool URL works on GitHub Pages) · [vite-plugin-pwa](https://vite-pwa-org.netlify.app) · [marked](https://marked.js.org) · [DOMPurify](https://github.com/cure53/DOMPurify) · [highlight.js](https://highlightjs.org) · [html2pdf.js](https://ekoopmans.github.io/html2pdf.js/) · [ffmpeg.wasm](https://ffmpegwasm.netlify.app) · [Vitest](https://vitest.dev)
