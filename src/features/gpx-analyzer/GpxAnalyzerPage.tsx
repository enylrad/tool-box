import { FileDropTarget } from '../../components/FileDropTarget'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { RouteWorkspace } from './RouteWorkspace'
import { EmptyState } from './components/EmptyState'
import { OpenGpxButton } from './components/OpenGpxButton'
import { useGpxFile } from './hooks/useGpxFile'
import { SAMPLE_FILE_NAME, createSampleGpx } from './lib/sampleRoute'

export default function GpxAnalyzerPage() {
  useDocumentTitle('GPX Route & Elevation Analyzer')

  const { route, error, isLoading, loadFile, loadText } = useGpxFile()
  const handleFile = (file: File) => void loadFile(file)
  const title = route?.analysis.name ?? route?.fileName

  return (
    <FileDropTarget onFile={handleFile}>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0 flex-1 basis-56">
          <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{title ?? 'GPX Route & Elevation Analyzer'}</h1>
          <p className="truncate text-xs text-slate-500 dark:text-slate-400">
            {route ? route.fileName : 'Open a GPX file to analyze its route and elevation'}
          </p>
        </div>
        {route && <OpenGpxButton onFile={handleFile} />}
      </div>
      {error && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {route ? (
        <RouteWorkspace key={route.id} route={route} />
      ) : (
        <EmptyState isLoading={isLoading} onFile={handleFile} onTrySample={() => loadText(SAMPLE_FILE_NAME, createSampleGpx())} />
      )}
    </FileDropTarget>
  )
}
