import { fileNameOf, type BundleFile } from '../lib/bundle'

// A checkerboard behind transparent icons, like image editors show.
const CHECKERBOARD_CLASS =
  'bg-[conic-gradient(#e2e8f0_25%,#ffffff_0_50%,#e2e8f0_0_75%,#ffffff_0)] bg-[length:12px_12px]'

// Monochrome icons are white silhouettes, so they are shown on a dark background.
const DARK_CLASS = 'bg-slate-700'

const MAX_DISPLAY_SIZE = 64

interface IconTileProps {
  file: BundleFile
  previewUrl: string | undefined
  onDownload: (file: BundleFile) => void
}

export function IconTile({ file, previewUrl, onDownload }: IconTileProps) {
  const displaySize = Math.min(file.size ?? MAX_DISPLAY_SIZE, MAX_DISPLAY_SIZE)
  const folder = file.path.split('/').slice(1, -1).join('/')
  const sizeLabel = file.icoSizes ? `${file.icoSizes.length} sizes, ${file.icoSizes[0]}–${file.size} px` : `${file.size}×${file.size}`

  return (
    <button
      type="button"
      onClick={() => onDownload(file)}
      title={`Download ${file.path}`}
      className="flex w-full flex-col items-center gap-2 rounded-lg border border-slate-200 p-2 text-center transition hover:border-sky-400 focus-visible:outline-2 focus-visible:outline-sky-600 dark:border-slate-800 dark:hover:border-sky-500"
    >
      <span className={`flex size-20 items-center justify-center rounded ${file.variant === 'monochrome' ? DARK_CLASS : CHECKERBOARD_CLASS}`}>
        {previewUrl ? (
          <img src={previewUrl} alt="" width={displaySize} height={displaySize} />
        ) : (
          <span className="rounded bg-slate-800 px-2 py-1 text-xs font-semibold text-white uppercase">{file.type}</span>
        )}
      </span>
      <span className="w-full min-w-0">
        <span className="block truncate text-xs font-medium text-slate-700 dark:text-slate-200">{fileNameOf(file.path)}</span>
        {folder && <span className="block truncate text-[11px] text-slate-500 dark:text-slate-400">{folder}</span>}
        <span className="block text-[11px] text-slate-500 dark:text-slate-400">{sizeLabel}</span>
      </span>
    </button>
  )
}
