import type { CSSProperties } from 'react'
import { IDENTITY_TRANSFORM, type CropRect, type Size, type Transform } from '../lib/cropGeometry'
import { computePreviewLayout } from '../lib/previewLayout'
import { CropOverlay } from './CropOverlay'

interface VideoPreviewProps {
  url: string
  /** Frame size once known; until then the video is shown as is. */
  frame: Size | null
  isUnavailable: boolean
  transform: Transform
  isEditingCrop: boolean
  aspectRatio: number | null
  onCropChange: (crop: CropRect) => void
  videoRef: (video: HTMLVideoElement | null) => void
  onLoadedMetadata: (video: HTMLVideoElement) => void
  onError: () => void
}

/**
 * Shows the video as it will be exported. While the crop is being edited the
 * full, untransformed frame is shown instead so the handles line up with it.
 */
export function VideoPreview({
  url,
  frame,
  isUnavailable,
  transform,
  isEditingCrop,
  aspectRatio,
  onCropChange,
  videoRef,
  onLoadedMetadata,
  onError,
}: VideoPreviewProps) {
  const hasFrame = frame !== null && frame.width > 0 && frame.height > 0
  const layout = hasFrame ? computePreviewLayout(frame, isEditingCrop ? IDENTITY_TRANSFORM : transform) : null
  const ratio = layout?.aspectRatio ?? 16 / 9

  // The box is as large as fits in the container (a size query container) with the output's aspect ratio.
  const boxStyle: CSSProperties = { width: `min(100cqw, calc(100cqh * ${ratio}))`, aspectRatio: ratio }

  return (
    <div className="flex min-h-0 flex-1 items-center justify-center bg-slate-950 p-4">
      <div className="flex h-full w-full items-center justify-center" style={{ containerType: 'size' }}>
        <div className="relative" style={boxStyle}>
          <div className="absolute overflow-hidden" style={layout ? { left: '50%', top: '50%', ...layout.stage } : { inset: 0 }}>
            {isUnavailable ? (
              <div
                className="absolute flex items-center justify-center bg-[repeating-linear-gradient(45deg,#1e293b_0_12px,#0f172a_12px_24px)] p-4 text-center text-sm text-slate-300"
                style={layout ? layout.video : { inset: 0 }}
              >
                <p className="max-w-xs rounded bg-slate-950/80 p-2">
                  This browser can’t play this file, so there is no preview — but it can still be converted.
                </p>
              </div>
            ) : (
              <video
                ref={videoRef}
                src={url}
                preload="auto"
                playsInline
                onLoadedMetadata={(event) => onLoadedMetadata(event.currentTarget)}
                onError={onError}
                className={`absolute max-w-none ${layout ? 'object-fill' : 'inset-0 h-full w-full object-contain'}`}
                style={layout?.video}
              />
            )}
          </div>
          {isEditingCrop && hasFrame && transform.crop && (
            <CropOverlay frame={frame} crop={transform.crop} aspectRatio={aspectRatio} onChange={onCropChange} />
          )}
        </div>
      </div>
    </div>
  )
}
