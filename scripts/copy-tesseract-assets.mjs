// Copies the Tesseract.js runtime (worker, WebAssembly core and language data)
// from node_modules into public/tesseract/ so the OCR tool is served from this
// site instead of a CDN. Runs automatically before `npm run dev` and `npm run build`.
import { copyFileSync, mkdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const rootDir = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputDir = join(rootDir, 'public', 'tesseract')

const packageDir = (name) => dirname(require.resolve(`${name}/package.json`))

// The OCR tool always uses the LSTM engine, so only the LSTM-only cores are
// needed. Tesseract.js picks the fastest one the browser supports at runtime.
const CORE_FILES = [
  'tesseract-core-lstm.wasm.js',
  'tesseract-core-simd-lstm.wasm.js',
  'tesseract-core-relaxedsimd-lstm.wasm.js',
]

// Must match the languages offered in src/features/image-ocr/lib/ocrLanguages.ts.
const LANGUAGES = ['eng', 'spa']

const copies = [
  [join(packageDir('tesseract.js'), 'dist', 'worker.min.js'), join(outputDir, 'worker.min.js')],
  ...CORE_FILES.map((file) => [join(packageDir('tesseract.js-core'), file), join(outputDir, 'core', file)]),
  ...LANGUAGES.map((lang) => [
    join(packageDir(`@tesseract.js-data/${lang}`), '4.0.0_best_int', `${lang}.traineddata.gz`),
    join(outputDir, 'lang', `${lang}.traineddata.gz`),
  ]),
]

rmSync(outputDir, { recursive: true, force: true })
for (const [from, to] of copies) {
  mkdirSync(dirname(to), { recursive: true })
  copyFileSync(from, to)
}
console.log(`Copied ${copies.length} Tesseract.js assets to public/tesseract/`)
