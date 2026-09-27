import { formatQuantity } from '../lib/formatStats'
import type { LoadedModel } from '../lib/loadModel'
import { OpenFilesButton } from './OpenFilesButton'

interface ViewerHeaderProps {
  model: LoadedModel | null
  isLoading: boolean
  onFiles: (files: File[]) => void
}

export function ViewerHeader({ model, isLoading, onFiles }: ViewerHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 flex-1 basis-56">
        <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{model?.fileName ?? '3D Model Viewer'}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          {isLoading
            ? 'Loading model…'
            : model
              ? [model.format.toUpperCase(), formatQuantity(model.stats.triangles, 'triangle'), formatQuantity(model.stats.vertices, 'vertex', 'vertices')].join(' · ')
              : 'Open an OBJ, glTF or GLB file to view it in 3D'}
        </p>
      </div>
      {model && <OpenFilesButton onFiles={onFiles} label="Open another model" disabled={isLoading} />}
    </div>
  )
}
