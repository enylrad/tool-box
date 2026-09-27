import { Button } from '../../components/Button'
import { Panel } from '../../components/Panel'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { AppearancePanel } from './components/AppearancePanel'
import { ExportBar } from './components/ExportBar'
import { PlatformPanel } from './components/PlatformPanel'
import { PreviewPanel } from './components/PreviewPanel'
import { SourcePanel } from './components/SourcePanel'
import { WebAppPanel } from './components/WebAppPanel'
import { useIconBundle } from './hooks/useIconBundle'
import { useIconExport } from './hooks/useIconExport'
import { useIconSettings } from './hooks/useIconSettings'
import { useIconSource } from './hooks/useIconSource'

export default function IconGeneratorPage() {
  useDocumentTitle('Icon & Favicon Generator')

  const { settings, updateSettings, setPlatform, resetAppearance } = useIconSettings()
  const source = useIconSource()
  const bundle = useIconBundle(source.source, source.svgText, settings)
  const iconExport = useIconExport(bundle.files, settings.appName)

  const totalBytes = bundle.files.reduce((total, file) => total + file.data.length, 0)
  const isRendering = bundle.status === 'rendering' || source.isPreparing

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto grid max-w-7xl gap-6 p-4 lg:grid-cols-[380px_minmax(0,1fr)] lg:p-6">
        <div className="space-y-4">
          <Panel title="Source image" description="Everything is generated on your device. Nothing is uploaded.">
            <SourcePanel
              image={source.image}
              error={source.error}
              warning={source.warning}
              isVector={source.isVector}
              onFile={(file) => void source.load(file)}
              onRemove={source.clear}
            />
          </Panel>

          <Panel title="Platforms">
            <PlatformPanel platforms={settings.platforms} onChange={setPlatform} />
          </Panel>

          <Panel
            title="Appearance"
            actions={
              <Button variant="ghost" onClick={resetAppearance}>
                Reset
              </Button>
            }
          >
            <AppearancePanel settings={settings} onChange={updateSettings} />
          </Panel>

          {settings.platforms.web && (
            <Panel title="Web app manifest" description="Written to site.webmanifest and the <head> snippet.">
              <WebAppPanel settings={settings} onChange={updateSettings} />
            </Panel>
          )}
        </div>

        <div className="space-y-4">
          <Panel title="Icons" description="Shown at their real size (up to 64 px). Previews with a mask show how each platform crops the icon.">
            <ExportBar
              fileCount={bundle.files.length}
              totalBytes={totalBytes}
              disabled={bundle.status !== 'ready' || bundle.files.length === 0}
              isRendering={isRendering}
              error={iconExport.error}
              onDownloadZip={iconExport.downloadZip}
            />
            <PreviewPanel
              status={source.isPreparing ? 'rendering' : bundle.status}
              files={bundle.files}
              previews={bundle.previews}
              error={bundle.error}
              settings={settings}
              onDownloadFile={iconExport.downloadFile}
            />
          </Panel>
        </div>
      </div>
    </div>
  )
}
