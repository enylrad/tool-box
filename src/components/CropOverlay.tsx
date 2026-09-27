import { useRef, type PointerEvent } from 'react'
import { dragCrop, type CropHandle, type CropRect, type Size } from '../lib/cropGeometry'

interface CropOverlayProps {
  frame: Size
  crop: CropRect
  aspectRatio: number | null
  onChange: (crop: CropRect) => void
}

interface DragState {
  handle: CropHandle
  pointerId: number
  startX: number
  startY: number
  startCrop: CropRect
  /** Source pixels per screen pixel. */
  scale: number
}

const CORNERS: { handle: Exclude<CropHandle, 'move'>; className: string; cursor: string }[] = [
  { handle: 'nw', className: '-top-2 -left-2', cursor: 'nwse-resize' },
  { handle: 'ne', className: '-top-2 -right-2', cursor: 'nesw-resize' },
  { handle: 'sw', className: '-bottom-2 -left-2', cursor: 'nesw-resize' },
  { handle: 'se', className: '-bottom-2 -right-2', cursor: 'nwse-resize' },
]

const percent = (value: number, total: number) => `${(value / total) * 100}%`

/** Draggable crop rectangle drawn over the untransformed video frame. */
export function CropOverlay({ frame, crop, aspectRatio, onChange }: CropOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const dragRef = useRef<DragState | null>(null)

  const startDrag = (event: PointerEvent, handle: CropHandle) => {
    const container = containerRef.current
    if (!container || event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = {
      handle,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startCrop: crop,
      scale: frame.width / container.getBoundingClientRect().width,
    }
  }

  const handleMove = (event: PointerEvent) => {
    const drag = dragRef.current
    if (!drag || drag.pointerId !== event.pointerId) return
    const dx = (event.clientX - drag.startX) * drag.scale
    const dy = (event.clientY - drag.startY) * drag.scale
    onChange(dragCrop(drag.startCrop, drag.handle, dx, dy, frame, aspectRatio))
  }

  const endDrag = (event: PointerEvent) => {
    if (dragRef.current?.pointerId === event.pointerId) dragRef.current = null
  }

  const boxStyle = {
    left: percent(crop.x, frame.width),
    top: percent(crop.y, frame.height),
    width: percent(crop.width, frame.width),
    height: percent(crop.height, frame.height),
  }

  return (
    <div ref={containerRef} className="absolute inset-0 touch-none select-none">
      {/* The shade is clipped to the frame; the box and its handles may overhang the edges so they stay grabbable. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute shadow-[0_0_0_9999px_rgba(2,6,23,0.6)]" style={boxStyle} />
      </div>
      <div
        role="presentation"
        onPointerDown={(event) => startDrag(event, 'move')}
        onPointerMove={handleMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        className="absolute cursor-move border-2 border-white"
        style={boxStyle}
      >
        {/* Rule-of-thirds guides. */}
        <div className="pointer-events-none absolute inset-0 grid grid-cols-3 grid-rows-3">
          {Array.from({ length: 9 }, (_, index) => (
            <div key={index} className="border border-white/25" />
          ))}
        </div>
        {CORNERS.map(({ handle, className, cursor }) => (
          <div
            key={handle}
            role="presentation"
            onPointerDown={(event) => startDrag(event, handle)}
            onPointerMove={handleMove}
            onPointerUp={endDrag}
            onPointerCancel={endDrag}
            className={`absolute size-4 rounded-sm border-2 border-sky-500 bg-white ${className}`}
            style={{ cursor }}
          />
        ))}
        <span className="pointer-events-none absolute top-1 left-1 rounded bg-slate-950/70 px-1.5 py-0.5 font-mono text-[11px] text-white tabular-nums">
          {crop.width}×{crop.height}
        </span>
      </div>
    </div>
  )
}
