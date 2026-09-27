import { useEffect, useState } from 'react'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { downloadBlob, toFileName } from '../../lib/download'
import { EmptyState } from './components/EmptyState'
import { FileDropTarget } from './components/FileDropTarget'
import { ModelInfoPanel } from './components/ModelInfoPanel'
import { ViewerHeader } from './components/ViewerHeader'
import { ViewerToolbar } from './components/ViewerToolbar'
import { useModelAnimations } from './hooks/useModelAnimations'
import { useModelFile } from './hooks/useModelFile'
import { useThreeScene } from './hooks/useThreeScene'
import { useViewerSettings } from './hooks/useViewerSettings'

/** Checkerboard shown behind the canvas when the background is transparent. */
const CHECKERBOARD_CLASS =
  'bg-[conic-gradient(#e2e8f0_25%,#f8fafc_0_50%,#e2e8f0_0_75%,#f8fafc_0)] bg-size-[24px_24px] dark:bg-[conic-gradient(#1e293b_25%,#0f172a_0_50%,#1e293b_0_75%,#0f172a_0)]'

export default function ModelViewerPage() {
  useDocumentTitle('3D Model Viewer')

  const { containerRef, scene, error: sceneError } = useThreeScene()
  const { model, error: loadError, isLoading, loadFiles } = useModelFile()
  const [settings, updateSettings] = useViewerSettings()
  const [screenshotError, setScreenshotError] = useState<string | null>(null)
  const handleFiles = (files: File[]) => void loadFiles(files)

  // Show the model before choosing its animation (the effects run in this order).
  useEffect(() => {
    scene?.setModel(model?.object ?? null, model?.animations)
  }, [scene, model])
  const animation = useModelAnimations(scene, model)

  useEffect(() => scene?.setWireframe(settings.wireframe), [scene, settings.wireframe])
  useEffect(() => scene?.setShowHelpers(settings.showGrid), [scene, settings.showGrid])
  useEffect(() => scene?.setAutoRotate(settings.autoRotate), [scene, settings.autoRotate])
  useEffect(() => scene?.setBackground(settings.background), [scene, settings.background])

  const handleScreenshot = async () => {
    if (!scene) return
    try {
      setScreenshotError(null)
      const blob = await scene.capturePng()
      downloadBlob(blob, toFileName(model?.fileName.replace(/\.[^.]+$/, '') ?? '', 'png', 'model'))
    } catch (error) {
      setScreenshotError(error instanceof Error ? error.message : String(error))
    }
  }

  const error = sceneError ?? loadError ?? screenshotError

  return (
    <FileDropTarget onFiles={handleFiles}>
      <ViewerHeader model={model} isLoading={isLoading} onFiles={handleFiles} />
      <ViewerToolbar
        settings={settings}
        onChange={updateSettings}
        onResetView={() => scene?.resetView()}
        onScreenshot={() => void handleScreenshot()}
        disabled={!scene || !model}
      />
      {error && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {model && model.missing.length > 0 && !loadError && (
        <p role="status" className="bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          Not found: {model.missing.join(', ')}. Drop {model.missing.length > 1 ? 'these files' : 'this file'} together with the model to
          see every material and texture.
        </p>
      )}
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className={`relative min-h-64 flex-1 ${settings.background === 'transparent' ? CHECKERBOARD_CLASS : ''}`}>
          <div ref={containerRef} className="absolute inset-0" aria-label="3D view" role="img" />
          {(!model || isLoading) && <EmptyState isLoading={isLoading} onFiles={handleFiles} />}
        </div>
        {model && (
          <ModelInfoPanel
            model={model}
            clipIndex={animation.clipIndex}
            isPlaying={animation.isPlaying}
            onSelectClip={animation.selectClip}
            onPlayingChange={animation.setPlaying}
          />
        )}
      </div>
    </FileDropTarget>
  )
}
