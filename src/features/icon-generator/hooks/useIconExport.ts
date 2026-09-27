import { useCallback, useState } from 'react'
import { downloadBlob, toFileName } from '../../../lib/download'
import { fileNameOf, type BundleFile } from '../lib/bundle'
import { zipBundle } from '../lib/zip'

const MIME_TYPES: Record<BundleFile['type'], string> = {
  png: 'image/png',
  ico: 'image/x-icon',
  svg: 'image/svg+xml',
  text: 'text/plain;charset=utf-8',
}

/** Downloads the whole bundle as a .zip, or a single file. */
export function useIconExport(files: readonly BundleFile[], appName: string) {
  const [error, setError] = useState<string | null>(null)

  const downloadZip = useCallback(() => {
    setError(null)
    try {
      const zip = zipBundle(files)
      downloadBlob(new Blob([zip], { type: 'application/zip' }), toFileName(`${appName} icons`, 'zip', 'icons'))
    } catch (zipError) {
      console.error('ZIP export failed', zipError)
      setError('Could not create the ZIP file.')
    }
  }, [files, appName])

  const downloadFile = useCallback((file: BundleFile) => {
    downloadBlob(new Blob([file.data], { type: MIME_TYPES[file.type] }), fileNameOf(file.path))
  }, [])

  return { downloadZip, downloadFile, error }
}
