// Copies the OCR runtime from node_modules into public/ so the OCR tool is
// served from this site instead of a CDN:
//   - public/tesseract/: Tesseract.js worker, WebAssembly core and language data
//   - public/pdfjs/: pdf.js worker plus the fonts, CMaps, color profiles and
//     WebAssembly decoders it loads on demand for some PDFs
// Runs automatically before `npm run dev` and `npm run build`.
import { copyFileSync, cpSync, mkdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const publicDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'public')

const packageDir = (name) => dirname(require.resolve(`${name}/package.json`))

// The OCR tool always uses the LSTM engine, so only the LSTM-only cores are
// needed. Tesseract.js picks the fastest one the browser supports at runtime.
const TESSERACT_CORE_FILES = [
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm.js',
]

// Must match the languages offered in src/features/image-ocr/lib/ocrLanguages.ts.
const LANGUAGES = ['eng', 'spa']

const PDFJS_DIRECTORIES = ['cmaps', 'standard_fonts', 'iccs', 'wasm']

const tesseractDir = join(publicDir, 'tesseract')
const pdfjsDir = join(publicDir, 'pdfjs')

const fileCopies = [
  [join(packageDir('tesseract.js'), 'dist', 'worker.min.js'), join(tesseractDir, 'worker.min.js')],
  ...TESSERACT_CORE_FILES.map((file) => [join(packageDir('tesseract.js-core'), file), join(tesseractDir, 'core', file)]),
  ...LANGUAGES.map((lang) => [
    join(packageDir(`@tesseract.js-data/${lang}`), '4.0.0_best_int', `${lang}.traineddata.gz`),
    join(tesseractDir, 'lang', `${lang}.traineddata.gz`),
  ]),
  [join(packageDir('pdfjs-dist'), 'legacy', 'build', 'pdf.worker.min.mjs'), join(pdfjsDir, 'pdf.worker.min.mjs')],
]

for (const dir of [tesseractDir, pdfjsDir]) rmSync(dir, { recursive: true, force: true })
for (const [from, to] of fileCopies) {
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
}
for (const dir of PDFJS_DIRECTORIES) {
  cpSync(join(packageDir('pdfjs-dist'), dir), join(pdfjsDir, dir), { recursive: true })
}
console.log('Copied the Tesseract.js and pdf.js assets to public/tesseract/ and public/pdfjs/')
