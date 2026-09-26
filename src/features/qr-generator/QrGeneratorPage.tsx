import { Button } from '../../components/Button'
import { Panel } from '../../components/Panel'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { useImageFile } from '../../hooks/useImageFile'
import { ContentForm } from './components/ContentForm'
import { ContentTypePicker } from './components/ContentTypePicker'
import { ExportBar } from './components/ExportBar'
import { LogoPanel } from './components/LogoPanel'
import { QrPreview } from './components/QrPreview'
import { ShapePanel } from './components/ShapePanel'
import { StylePanel } from './components/StylePanel'
import { useQrCode } from './hooks/useQrCode'
import { useQrContent } from './hooks/useQrContent'
import { useQrExport } from './hooks/useQrExport'
import { useQrStyle } from './hooks/useQrStyle'
import { useShapeMask } from './hooks/useShapeMask'

export default function QrGeneratorPage() {
  useDocumentTitle('QR Code Generator')

  const { content, payload, setType, setText, updateSection } = useQrContent()
  const { style, updateStyle, resetStyle } = useQrStyle()
  const logo = useImageFile()
  const shape = useImageFile()
  const shapeMask = useShapeMask(shape.image?.element ?? null, style.shapeInvert)

  const result = useQrCode({ payload, style, logoDataUrl: logo.image?.dataUrl ?? null, shapeMask })
  const svg = result.status === 'ready' ? result.svg : null
  const qrExport = useQrExport(svg, `qr code ${content.type}`)

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto grid max-w-6xl gap-6 p-4 lg:grid-cols-[minmax(0,1fr)_380px] lg:p-6">
        <div className="space-y-4 lg:order-2">
          <div className="space-y-4 lg:sticky lg:top-6">
            <QrPreview result={result} transparentBackground={style.transparentBackground} />
            {result.status === 'ready' && result.warnings.length > 0 && (
              <ul className="space-y-1 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                {result.warnings.map((warning) => (
                  <li key={warning}>⚠ {warning}</li>
                ))}
              </ul>
            )}
            <ExportBar
              disabled={!svg}
              isExportingPng={qrExport.isExportingPng}
              copied={qrExport.copied}
              error={qrExport.error}
              onDownloadSvg={qrExport.downloadSvg}
              onDownloadPng={(size) => void qrExport.downloadPng(size)}
              onCopySvg={qrExport.copySvg}
            />
          </div>
        </div>

        <div className="space-y-4 lg:order-1">
          <Panel title="Content" description="Everything is generated on your device. Nothing is sent anywhere.">
            <ContentTypePicker value={content.type} onChange={setType} />
            <ContentForm content={content} onTextChange={setText} onSectionChange={updateSection} />
          </Panel>

          <Panel
            title="Style"
            actions={
              <Button variant="ghost" onClick={resetStyle}>
                Reset
              </Button>
            }
          >
            <StylePanel style={style} onChange={updateStyle} isErrorCorrectionForced={Boolean(logo.image)} />
          </Panel>

          <Panel title="Logo" description="Place an image in the middle of the code.">
            <LogoPanel
              logo={logo.image}
              error={logo.error}
              logoSize={style.logoSize}
              onFile={(file) => void logo.load(file)}
              onRemove={logo.clear}
              onSizeChange={(logoSize) => updateStyle({ logoSize })}
            />
          </Panel>

          <Panel
            title="Silhouette"
            description="Give the code the outline of an image: the real code stays in the center and the shape is filled with decorative modules."
          >
            <ShapePanel
              shapeImage={shape.image}
              error={shape.error}
              style={style}
              onFile={(file) => void shape.load(file)}
              onPreset={(preset) => void shape.loadDataUrl(preset.dataUrl, `${preset.name} (preset)`)}
              onRemove={shape.clear}
              onChange={updateStyle}
            />
          </Panel>
        </div>
      </div>
    </div>
  )
}
