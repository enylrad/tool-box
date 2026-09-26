import { Button } from '../../../components/Button'

interface ImagePreviewRowProps {
  src: string
  name: string
  onRemove: () => void
}

/** Thumbnail, file name and a remove button for an uploaded image. */
export function ImagePreviewRow({ src, name, onRemove }: ImagePreviewRowProps) {
  return (
    <div className="flex items-center gap-3 rounded-lg bg-slate-50 p-2 dark:bg-slate-800">
      <img src={src} alt="" className="size-12 shrink-0 rounded bg-white object-contain p-1" />
      <span className="min-w-0 flex-1 truncate text-sm text-slate-700 dark:text-slate-200">{name}</span>
      <Button variant="ghost" onClick={onRemove}>
        Remove
      </Button>
    </div>
  )
}
