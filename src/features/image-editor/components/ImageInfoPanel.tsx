import { useRef } from 'react'
import { Button } from '../../../components/Button'
import { formatBytes } from '../../../lib/formatBytes'
import type { SourceImage } from '../hooks/useSourceImage'
import { formatLabel } from '../lib/output'
import { IMAGE_ACCEPT } from './ImageDropZone'

interface ImageInfoPanelProps {
  image: SourceImage
  error: string | null
  onFile: (file: File) => void
  onRemove: () => void
}

export function ImageInfoPanel({ image, error, onFile, onRemove }: ImageInfoPanelProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-slate-800 dark:text-slate-100" title={image.fileName}>
          {image.fileName}
        </p>
        <p className="mt-0.5 text-xs text-slate-500 tabular-nums dark:text-slate-400">
          {image.width}×{image.height} px · {formatBytes(image.fileSize)} · {formatLabel(image.mimeType)}
        </p>
      </div>
      {error && <p className="text-xs text-red-600 dark:text-red-400">{error}</p>}
      <div className="flex gap-2">
        <Button className="flex-1" onClick={() => inputRef.current?.click()}>
          Open another…
        </Button>
        <Button variant="ghost" onClick={onRemove}>
          Close
        </Button>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={IMAGE_ACCEPT}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0]
          if (file) onFile(file)
          event.target.value = ''
        }}
      />
    </>
  )
}
