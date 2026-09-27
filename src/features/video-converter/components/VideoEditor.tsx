import { useRef, useState } from 'react'
import { Button } from '../../../components/Button'
import type { Size } from '../../../lib/cropGeometry'
import type { FfmpegEngine } from '../hooks/useFfmpeg'
import { useEditSettings } from '../hooks/useEditSettings'
import type { VideoFileState } from '../hooks/useVideoFile'
import { useVideoConversion } from '../hooks/useVideoConversion'
import { useVideoPlayback } from '../hooks/useVideoPlayback'
import { IDENTITY_TRANSFORM } from '../lib/cropGeometry'
import { captureFrame, extensionForMime, type ImageFormatId } from '../lib/captureFrame'
import { downloadBlob, toFileName } from '../../../lib/download'
import { formatBytes } from '../../../lib/formatBytes'
import { formatTimecode, type TrimRange } from '../lib/timecode'
import { VIDEO_ACCEPT, getOutputFormat } from '../lib/formats'
import { ConvertPanel } from './ConvertPanel'
import { OutputSettings } from './OutputSettings'
import { PlaybackBar } from './PlaybackBar'
import { Section } from './Section'
import { CropControls, RotateFlipControls } from './TransformControls'
import { TrimControls } from './TrimControls'
import { VideoPreview } from './VideoPreview'

/** Browsers start struggling with files this large in WebAssembly memory. */
const LARGE_FILE_BYTES = 1024 ** 3

interface VideoEditorProps {
  video: VideoFileState
  engine: FfmpegEngine
  onOpenFile: (file: File) => void
  onLoadedMetadata: (video: HTMLVideoElement) => void
  onPreviewError: () => void
}

/** The editing screen for one file. Render it with `key` set to the file URL so every file starts fresh. */
export function VideoEditor({ video, engine, onOpenFile, onLoadedMetadata, onPreviewError }: VideoEditorProps) {
  const { file, url, metadata, preview } = video
  const duration = metadata?.duration ?? null
  const frame: Size | null = metadata?.hasVideo && metadata.width > 0 ? { width: metadata.width, height: metadata.height } : null

  const settings = useEditSettings(duration)
  const [videoElement, setVideoElement] = useState<HTMLVideoElement | null>(null)
  const playback = useVideoPlayback(videoElement, settings.trim)
  const conversion = useVideoConversion(engine)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [isDownloadingImage, setIsDownloadingImage] = useState(false)
  const [downloadImageError, setDownloadImageError] = useState<string | null>(null)

  const format = getOutputFormat(settings.formatId)
  const isAudioOnly = format.kind === 'audio'
  const pictureDisabledReason = isAudioOnly
    ? 'Audio formats keep only the sound.'
    : !metadata
      ? 'Reading the video…'
      : !frame
        ? 'This file has no picture.'
        : null

  // Jump to the edited edge of the clip so the user sees the frame they picked.
  const handleTrimChange = (next: TrimRange) => {
    if (next.start !== settings.trim.start) playback.seek(next.start)
    else if (next.end !== settings.trim.end) playback.seek(next.end ?? duration ?? 0)
    settings.setTrim(next)
  }

  const handleDownloadImage = async (formatId: ImageFormatId) => {
    if (!videoElement) return
    videoElement.pause()
    setIsDownloadingImage(true)
    setDownloadImageError(null)
    try {
      const blob = await captureFrame(videoElement, settings.transform, formatId)
      const baseName = file.name.replace(/\.[^.]*$/, '')
      downloadBlob(blob, toFileName(`${baseName} ${formatTimecode(videoElement.currentTime)}`, extensionForMime(blob.type), 'frame'))
    } catch (cause) {
      console.error('Could not capture the frame', cause)
      setDownloadImageError('The photo could not be created. Try another frame or format.')
    } finally {
      setIsDownloadingImage(false)
    }
  }

  const handleConvert = () => {
    videoElement?.pause()
    settings.setIsEditingCrop(false)
    void conversion.convert({
      file,
      format,
      trim: settings.trim,
      transform: isAudioOnly ? IDENTITY_TRANSFORM : settings.transform,
      duration,
    })
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
        <div className="min-w-0 flex-1 basis-56">
          <h1 className="truncate text-sm font-semibold">{file.name}</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {formatBytes(file.size)}
            {frame && ` · ${frame.width}×${frame.height}`}
          </p>
        </div>
        <Button onClick={() => fileInputRef.current?.click()} disabled={conversion.state.status === 'running'}>
          Open another video
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept={VIDEO_ACCEPT}
          className="sr-only"
          tabIndex={-1}
          onChange={(event) => {
            const nextFile = event.target.files?.[0]
            if (nextFile) onOpenFile(nextFile)
            event.target.value = ''
          }}
        />
      </div>

      <div className="flex min-h-0 flex-1 flex-col overflow-y-auto lg:flex-row lg:overflow-hidden">
        <div className="flex h-[55vh] shrink-0 flex-col lg:h-auto lg:min-w-0 lg:flex-1 lg:shrink">
          <VideoPreview
            url={url}
            frame={frame}
            isUnavailable={preview === 'unavailable'}
            transform={isAudioOnly ? IDENTITY_TRANSFORM : settings.transform}
            isEditingCrop={settings.isEditingCrop && !isAudioOnly}
            aspectRatio={settings.aspectRatio}
            onCropChange={settings.setCrop}
            videoRef={setVideoElement}
            onLoadedMetadata={onLoadedMetadata}
            onError={onPreviewError}
          />
          {preview === 'ready' && duration !== null && (
            <PlaybackBar
              currentTime={playback.currentTime}
              duration={duration}
              isPlaying={playback.isPlaying}
              trim={settings.trim}
              onTogglePlay={playback.togglePlay}
              onSeek={playback.seek}
            />
          )}
        </div>

        <aside className="bg-white lg:w-96 lg:shrink-0 lg:overflow-y-auto lg:border-l lg:border-slate-200 dark:bg-slate-900 dark:lg:border-slate-800">
          <Section title="Trim" disabledReason={duration === null ? 'Reading the video length…' : null}>
            {duration !== null && (
              <TrimControls
                trim={settings.trim}
                duration={duration}
                currentTime={preview === 'ready' ? playback.currentTime : null}
                onChange={handleTrimChange}
              />
            )}
          </Section>
          <Section
            title="Rotate & flip"
            disabledReason={pictureDisabledReason}
            actions={
              (settings.transform.rotation !== 0 || settings.transform.flipHorizontal || settings.transform.flipVertical) && (
                <Button variant="ghost" className="-my-1.5 text-xs" onClick={settings.resetTransform}>
                  Reset
                </Button>
              )
            }
          >
            <RotateFlipControls transform={settings.transform} onRotate={settings.rotateBy} onToggleFlip={settings.toggleFlip} />
          </Section>
          <Section title="Crop" disabledReason={pictureDisabledReason}>
            {frame && (
              <CropControls
                frame={frame}
                crop={settings.transform.crop}
                isEditing={settings.isEditingCrop}
                aspectPresetId={settings.aspectPresetId}
                onStart={() => settings.startCrop(frame)}
                onRemove={settings.removeCrop}
                onEditingChange={settings.setIsEditingCrop}
                onAspectPreset={(presetId) => settings.chooseAspectPreset(presetId, frame)}
                onChange={settings.setCrop}
                onDownloadImage={(formatId) => void handleDownloadImage(formatId)}
                downloadImageDisabledReason={
                  preview === 'ready' ? null : 'This browser can’t play this file, so it can’t capture a photo.'
                }
                isDownloadingImage={isDownloadingImage}
                downloadImageError={downloadImageError}
              />
            )}
          </Section>
          <Section title="Output format">
            <OutputSettings formatId={settings.formatId} onChange={settings.setFormatId} />
          </Section>
          <div className="px-4 py-4">
            <ConvertPanel
              engineStatus={engine.status}
              state={conversion.state}
              formatLabel={format.label}
              largeFileWarning={file.size > LARGE_FILE_BYTES}
              onConvert={handleConvert}
              onCancel={conversion.cancel}
              onRetryEngine={engine.retry}
            />
          </div>
        </aside>
      </div>
    </div>
  )
}
