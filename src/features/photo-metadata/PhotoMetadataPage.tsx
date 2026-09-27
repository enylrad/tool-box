import { useEffect, useMemo, useState, type DragEvent } from 'react'
import { Button } from '../../components/Button'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { CleanCopyPanel } from './components/CleanCopyPanel'
import { EditHistoryCard } from './components/EditHistoryCard'
import { FingerprintCard } from './components/FingerprintCard'
import { InfoCard } from './components/InfoCard'
import { LocationCard } from './components/LocationCard'
import { ACCEPTED_FILES, PhotoDropZone } from './components/PhotoDropZone'
import { PhotoPreview } from './components/PhotoPreview'
import { PrivacyBadge } from './components/PrivacyBadge'
import { PrivacySummary } from './components/PrivacySummary'
import { RawMetadataTree } from './components/RawMetadataTree'
import { usePhotoFile } from './hooks/usePhotoFile'
import { buildPhotoReport } from './lib/photoReport'

export default function PhotoMetadataPage() {
  useDocumentTitle('Photo Metadata Viewer')
  const { photo, error, isLoading, load, clear } = usePhotoFile()
  const [isDragging, setIsDragging] = useState(false)

  const report = useMemo(
    () =>
      photo &&
      buildPhotoReport({
        file: photo.file,
        format: photo.format,
        tags: photo.tags,
        c2pa: photo.c2pa,
        decoded: photo.decoded,
      }),
    [photo],
  )

  // Paste an image from the clipboard anywhere on the page.
  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      const file = event.clipboardData?.files[0]
      if (file) {
        event.preventDefault()
        void load(file)
      }
    }
    window.addEventListener('paste', handlePaste)
    return () => window.removeEventListener('paste', handlePaste)
  }, [load])

  // Once a photo is open, dropping another one anywhere replaces it.
  const dropHandlers = photo
    ? {
        onDragOver: (event: DragEvent) => {
          event.preventDefault()
          setIsDragging(true)
        },
        onDragLeave: (event: DragEvent) => {
          if (event.currentTarget === event.target) setIsDragging(false)
        },
        onDrop: (event: DragEvent) => {
          event.preventDefault()
          setIsDragging(false)
          const file = event.dataTransfer.files[0]
          if (file) void load(file)
        },
      }
    : {}

  return (
    <div className="relative flex-1 overflow-auto" {...dropHandlers}>
      {isDragging && (
        <div className="pointer-events-none fixed inset-0 z-10 flex items-center justify-center bg-sky-500/10 text-lg font-semibold text-sky-700 ring-4 ring-sky-500 ring-inset dark:text-sky-300">
          Drop to open this photo
        </div>
      )}
      <div className="mx-auto max-w-6xl space-y-6 px-4 py-6 sm:py-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Photo Metadata Viewer</h1>
            <p className="mt-1 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              See everything hidden inside a photo: camera and exposure, exact dates, GPS location, editing history and every
              raw EXIF, XMP, IPTC and ICC tag — then remove it before sharing.
            </p>
          </div>
          <PrivacyBadge />
        </div>

        {error && (
          <p role="alert" className="rounded-md bg-red-50 p-3 text-sm text-red-800 dark:bg-red-950 dark:text-red-200">
            {error}
          </p>
        )}

        {!photo || !report ? (
          <PhotoDropZone onFile={load} isLoading={isLoading} />
        ) : (
          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
            <aside className="space-y-4 lg:sticky lg:top-6">
              <PhotoPreview url={photo.previewUrl} isThumbnail={photo.previewIsThumbnail} fileName={photo.file.name} />
              <div className="flex gap-2">
                <label className="inline-flex flex-1 cursor-pointer items-center justify-center rounded-md bg-white px-3 py-1.5 text-sm font-medium ring-1 ring-slate-300 ring-inset hover:bg-slate-50 dark:bg-slate-800 dark:ring-slate-600 dark:hover:bg-slate-700">
                  {isLoading ? 'Reading…' : 'Open another photo'}
                  <input
                    type="file"
                    accept={ACCEPTED_FILES}
                    className="sr-only"
                    onChange={(event) => {
                      const file = event.target.files?.[0]
                      if (file) void load(file)
                      event.target.value = ''
                    }}
                  />
                </label>
                <Button variant="ghost" onClick={clear}>
                  Close
                </Button>
              </div>
              <CleanCopyPanel bytes={photo.bytes} format={photo.format} fileName={photo.file.name} orientation={report.orientation} />
            </aside>

            <div className="min-w-0 space-y-4">
              <PrivacySummary level={report.privacy.level} risks={report.privacy.risks} />
              <InfoCard title="Basic information" rows={report.basicRows} />
              <InfoCard
                title="Camera & exposure"
                rows={report.cameraRows}
                empty="No camera information (EXIF) was found. Messaging apps and social networks usually remove it."
              />
              <LocationCard location={report.location} />
              <EditHistoryCard edits={report.edits} c2pa={photo.c2pa} />
              <FingerprintCard sha256={photo.sha256} format={photo.format} fileName={photo.file.name} warning={report.formatWarning} />
              <RawMetadataTree tree={report.tree} rawXmp={photo.tags.xmp?._raw} fileName={photo.file.name} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
