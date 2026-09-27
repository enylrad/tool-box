import { ImageIcon } from './Icons'

interface PhotoPreviewProps {
  url: string | null
  isThumbnail: boolean
  fileName: string
}

export function PhotoPreview({ url, isThumbnail, fileName }: PhotoPreviewProps) {
  return (
    <figure className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div className="flex aspect-[4/3] items-center justify-center bg-[repeating-conic-gradient(#f1f5f9_0_25%,#fff_0_50%)] bg-[length:16px_16px] dark:bg-[repeating-conic-gradient(#1e293b_0_25%,#0f172a_0_50%)]">
        {url ? (
          <img src={url} alt={`Preview of ${fileName}`} className="max-h-full max-w-full object-contain" />
        ) : (
          <div className="flex flex-col items-center gap-2 px-6 text-center text-sm text-slate-500 dark:text-slate-400">
            <ImageIcon className="size-8" />
            Your browser cannot display this format, but its metadata was read.
          </div>
        )}
      </div>
      <figcaption className="border-t border-slate-200 px-4 py-3 text-sm dark:border-slate-800">
        <p className="truncate font-medium" title={fileName}>
          {fileName}
        </p>
        {isThumbnail && (
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            Showing the thumbnail embedded in the file — your browser cannot display the full image.
          </p>
        )}
      </figcaption>
    </figure>
  )
}
