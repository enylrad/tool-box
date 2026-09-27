import { useState } from 'react'
import { Button } from '../../../components/Button'
import { downloadBlob } from '../../../lib/download'
import type { ImageFormat } from '../lib/detectFormat'
import { canStrip, cleanFileName, stripMetadata, type StripResult } from '../lib/stripMetadata'

interface CleanCopyPanelProps {
  bytes: Uint8Array
  format: ImageFormat | null
  fileName: string
  orientation: number | undefined
}

/** Downloads a copy of the photo without metadata (lossless for JPEG, PNG and WebP). */
export function CleanCopyPanel({ bytes, format, fileName, orientation }: CleanCopyPanelProps) {
  const [keepOrientation, setKeepOrientation] = useState(true)
  const [result, setResult] = useState<StripResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const supported = canStrip(format?.id)
  const rotated = orientation !== undefined && orientation > 1

  const handleClean = () => {
    if (!format) return
    setError(null)
    try {
      const stripped = stripMetadata(bytes, format.id, keepOrientation && rotated ? orientation : undefined)
      downloadBlob(new Blob([stripped.bytes as Uint8Array<ArrayBuffer>], { type: format.mime }), cleanFileName(fileName))
      setResult(stripped)
    } catch (stripError) {
      setError(stripError instanceof Error ? stripError.message : 'The metadata could not be removed.')
    }
  }

  return (
    <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      <div>
        <h2 className="font-semibold">Remove metadata</h2>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {supported
            ? 'Download a copy without EXIF, GPS, XMP, IPTC or comments. The image itself is not re-compressed, so quality is identical.'
            : `Not available for ${format?.name ?? 'this format'} files yet — only JPEG, PNG and WebP can be cleaned without re-encoding.`}
        </p>
      </div>
      {supported && rotated && (
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={keepOrientation} onChange={(event) => setKeepOrientation(event.target.checked)} className="mt-1" />
          <span>Keep the rotation flag so the photo is not displayed sideways (reveals nothing personal)</span>
        </label>
      )}
      <Button variant="primary" className="w-full" disabled={!supported} onClick={handleClean}>
        Download clean copy
      </Button>
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
      {result && (
        <div className="text-xs text-slate-500 dark:text-slate-400">
          {result.removed.length > 0 ? (
            <>
              <p>Removed:</p>
              <ul className="mt-1 list-disc pl-4">
                {result.removed.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </>
          ) : (
            <p>There was no metadata to remove.</p>
          )}
          {result.keptOrientation && <p className="mt-1">Only the rotation flag was kept.</p>}
        </div>
      )}
    </section>
  )
}
