import { useMemo, useState } from 'react'
import { Button } from '../../components/Button'
import { Panel } from '../../components/Panel'
import { centeredCrop, type CropRect } from '../../lib/cropGeometry'
import { downloadBlob } from '../../lib/download'
import { CompareSlider } from './components/CompareSlider'
import { CropPanel } from './components/CropPanel'
import { CropView } from './components/CropView'
import { ExportPanel } from './components/ExportPanel'
import { ImageInfoPanel } from './components/ImageInfoPanel'
import { ResizePanel } from './components/ResizePanel'
import { SizeSummary } from './components/SizeSummary'
import { WatermarkPanel } from './components/WatermarkPanel'
import { useEditorSettings } from './hooks/useEditorSettings'
import { useRenderedOutput } from './hooks/useRenderedOutput'
import type { SourceImage } from './hooks/useSourceImage'
import { OUTPUT_FORMAT_IDS, OUTPUT_FORMATS, extensionFor, outputFileName } from './lib/output'
import { canEncode } from './lib/render'
import { computeOutputSize, presetRatio } from './lib/resize'

type View = 'crop' | 'compare'

interface ImageWorkspaceProps {
  image: SourceImage
  error: string | null
  onFile: (file: File) => void
  onClose: () => void
}

const VIEWS: { id: View; label: string }[] = [
  { id: 'crop', label: 'Crop' },
  { id: 'compare', label: 'Before / after' },
]

/** Editing screen for one image. It is re-mounted for each new image, which resets the crop. */
export function ImageWorkspace({ image, error, onFile, onClose }: ImageWorkspaceProps) {
  const { settings, updateResize, updateWatermark, updateOutput, resetWatermark } = useEditorSettings()
  const [crop, setCrop] = useState<CropRect>({ x: 0, y: 0, width: image.width, height: image.height })
  const [aspectPresetId, setAspectPresetId] = useState('free')
  const [view, setView] = useState<View>('crop')
  const [formats] = useState(() => OUTPUT_FORMAT_IDS.filter((id) => canEncode(OUTPUT_FORMATS[id].mimeType)))

  const aspectRatio = presetRatio(aspectPresetId, image)
  const { width: outputWidth, height: outputHeight } = computeOutputSize(crop, settings.resize)
  // A saved format this browser cannot encode (WebP on old Safari) falls back to PNG.
  const outputFormat = formats.includes(settings.output.format) ? settings.output.format : 'png'
  const outputQuality = settings.output.quality

  const request = useMemo(
    () => ({
      image: image.element,
      crop,
      size: { width: outputWidth, height: outputHeight },
      watermark: settings.watermark,
      output: { format: outputFormat, quality: outputQuality },
    }),
    [image.element, crop, outputWidth, outputHeight, settings.watermark, outputFormat, outputQuality],
  )
  const rendered = useRenderedOutput(request)
  const outputSize = request.size

  const handleAspectPreset = (presetId: string) => {
    setAspectPresetId(presetId)
    const ratio = presetRatio(presetId, image)
    if (ratio !== null) setCrop(centeredCrop(image, ratio))
  }

  const resetCrop = () => {
    setAspectPresetId('free')
    setCrop({ x: 0, y: 0, width: image.width, height: image.height })
  }

  const download = () => {
    if (!rendered.output) return
    const { blob } = rendered.output
    downloadBlob(blob, outputFileName(image.fileName, extensionFor(blob.type)))
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
      <aside className="shrink-0 space-y-4 p-4 lg:w-[360px] lg:overflow-y-auto lg:border-r lg:border-slate-200 lg:dark:border-slate-800">
        <Panel title="Image">
          <ImageInfoPanel image={image} error={error} onFile={onFile} onRemove={onClose} />
        </Panel>
        <Panel title="Crop">
          <CropPanel
            image={image}
            crop={crop}
            aspectPresetId={aspectPresetId}
            onAspectPreset={handleAspectPreset}
            onChange={setCrop}
            onReset={resetCrop}
          />
        </Panel>
        <Panel title="Resize">
          <ResizePanel settings={settings.resize} cropSize={crop} outputSize={outputSize} onChange={updateResize} />
        </Panel>
        <Panel
          title="Watermark"
          actions={
            settings.watermark.enabled && (
              <Button variant="ghost" onClick={resetWatermark}>
                Reset
              </Button>
            )
          }
        >
          <WatermarkPanel settings={settings.watermark} onChange={updateWatermark} />
        </Panel>
        <Panel title="Export" description="Processed on your device with the canvas API. Nothing is uploaded.">
          <ExportPanel
            settings={request.output}
            formats={formats}
            outputFile={rendered.output?.blob ?? null}
            isRendering={rendered.isRendering}
            error={rendered.error}
            onChange={updateOutput}
            onDownload={download}
          />
        </Panel>
      </aside>

      <section className="order-first flex min-h-[70vh] min-w-0 flex-1 flex-col lg:order-none lg:min-h-0">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
          <div role="tablist" aria-label="Preview" className="flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-800">
            {VIEWS.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={view === id}
                onClick={() => setView(id)}
                className={`rounded-md px-3 py-1 text-sm font-medium whitespace-nowrap transition-colors ${
                  view === id
                    ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-600 dark:text-white'
                    : 'text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <SizeSummary image={image} outputSize={outputSize} output={rendered.output?.blob ?? null} isRendering={rendered.isRendering} />
        </div>
        <div className="flex min-h-0 flex-1 flex-col p-4 sm:p-6">
          {view === 'crop' ? (
            <CropView image={image} crop={crop} aspectRatio={aspectRatio} onChange={setCrop} />
          ) : (
            <CompareSlider
              image={image}
              crop={crop}
              outputSize={outputSize}
              afterUrl={rendered.output?.url ?? null}
              isRendering={rendered.isRendering}
            />
          )}
        </div>
      </section>
    </div>
  )
}
