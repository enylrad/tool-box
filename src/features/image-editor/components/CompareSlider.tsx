import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react'
import { useElementSize } from '../../../hooks/useElementSize'
import type { CropRect, Size } from '../../../lib/cropGeometry'
import type { SourceImage } from '../hooks/useSourceImage'
import { fitInside } from '../lib/resize'
import { CHECKERBOARD_STYLE } from './checkerboard'

interface CompareSliderProps {
  image: SourceImage
  crop: CropRect
  outputSize: Size
  /** The rendered image, or `null` until the first render is ready. */
  afterUrl: string | null
  isRendering: boolean
}

const clamp = (value: number) => Math.min(Math.max(value, 0), 100)
const percent = (value: number, total: number) => `${(value / total) * 100}%`

const BADGE_CLASS = 'pointer-events-none absolute top-2 rounded bg-slate-950/70 px-2 py-0.5 text-xs font-medium text-white'

/**
 * Before/after comparison: the cropped area of the original on the left of the
 * divider and the final image on the right, drawn in the same box.
 */
export function CompareSlider({ image, crop, outputSize, afterUrl, isRendering }: CompareSliderProps) {
  const [containerRef, box] = useElementSize<HTMLDivElement>()
  const stageRef = useRef<HTMLDivElement>(null)
  const draggingPointerRef = useRef<number | null>(null)
  const [position, setPosition] = useState(50)
  const display = fitInside(outputSize, box)

  const moveTo = (clientX: number) => {
    const stage = stageRef.current
    if (!stage) return
    const rect = stage.getBoundingClientRect()
    setPosition(clamp(((clientX - rect.left) / rect.width) * 100))
  }

  const handlePointerDown = (event: PointerEvent) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    draggingPointerRef.current = event.pointerId
    moveTo(event.clientX)
  }

  const handlePointerMove = (event: PointerEvent) => {
    if (draggingPointerRef.current === event.pointerId) moveTo(event.clientX)
  }

  const endDrag = (event: PointerEvent) => {
    if (draggingPointerRef.current === event.pointerId) draggingPointerRef.current = null
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    const step = event.shiftKey ? 10 : 2
    const next =
      event.key === 'ArrowLeft' ? position - step
      : event.key === 'ArrowRight' ? position + step
      : event.key === 'Home' ? 0
      : event.key === 'End' ? 100
      : null
    if (next === null) return
    event.preventDefault()
    setPosition(clamp(next))
  }

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 items-center justify-center">
      {display.width > 0 && (
        <div
          ref={stageRef}
          className="relative cursor-ew-resize touch-none overflow-hidden shadow-sm select-none"
          style={{ ...CHECKERBOARD_STYLE, width: display.width, height: display.height }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
        >
          {/* Before: the full original, offset and scaled so only the crop fills the box. */}
          <img
            src={image.url}
            alt="Before"
            draggable={false}
            className="absolute max-w-none"
            style={{
              left: `-${percent(crop.x, crop.width)}`,
              top: `-${percent(crop.y, crop.height)}`,
              width: percent(image.width, crop.width),
              height: percent(image.height, crop.height),
            }}
          />
          {afterUrl && (
            <img
              src={afterUrl}
              alt="After"
              draggable={false}
              className="absolute inset-0 size-full"
              style={{ clipPath: `inset(0 0 0 ${position}%)` }}
            />
          )}

          <span className={`${BADGE_CLASS} left-2`}>Before</span>
          <span className={`${BADGE_CLASS} right-2`}>{afterUrl ? 'After' : 'Processing…'}</span>
          {afterUrl && isRendering && (
            <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 rounded bg-slate-950/70 px-2 py-0.5 text-xs text-white">
              Updating…
            </span>
          )}

          <div className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(2,6,23,0.3)]" style={{ left: `${position}%` }} />
          <div
            role="slider"
            tabIndex={0}
            aria-label="Before and after divider"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(position)}
            aria-valuetext={`${Math.round(position)}% before`}
            onKeyDown={handleKeyDown}
            className="absolute top-1/2 flex size-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-2 border-white bg-sky-600 text-sm text-white shadow-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-400"
            style={{ left: `${position}%` }}
          >
            <span aria-hidden="true">⇔</span>
          </div>
        </div>
      )}
    </div>
  )
}
