import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { useElementSize } from '../../../hooks/useElementSize'
import { durationOf, type AudioData, type TimeRange } from '../lib/audioData'
import { formatTime } from '../lib/formatTime'
import { computePeaks } from '../lib/peaks'

interface WaveformProps {
  audio: AudioData
  selection: TimeRange | null
  position: number
  onSelectionChange: (selection: TimeRange | null) => void
  onSeek: (seconds: number) => void
}

/** Pointer movement below this many pixels is a click (seek), not a drag (select). */
const DRAG_THRESHOLD_PX = 4
const HEIGHT_PX = 176

const COLORS = {
  wave: '#0ea5e9',
  waveSelected: '#0284c7',
  selection: 'rgba(14, 165, 233, 0.18)',
  axis: 'rgba(148, 163, 184, 0.45)',
  playhead: '#ef4444',
}

/** Waveform with click-to-seek, drag-to-select and a playhead. */
export function Waveform({ audio, selection, position, onSelectionChange, onSeek }: WaveformProps) {
  const [containerRef, { width }] = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const dragRef = useRef<{ startX: number; startTime: number; isDragging: boolean } | null>(null)
  const duration = durationOf(audio)
  const pixelRatio = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  const deviceWidth = Math.floor(width * pixelRatio)

  const peaks = useMemo(() => computePeaks(audio, deviceWidth), [audio, deviceWidth])

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas?.getContext('2d')
    if (!canvas || !context || deviceWidth === 0) return
    const deviceHeight = Math.floor(HEIGHT_PX * pixelRatio)
    canvas.width = deviceWidth
    canvas.height = deviceHeight
    context.clearRect(0, 0, deviceWidth, deviceHeight)

    const toX = (seconds: number) => (duration === 0 ? 0 : (seconds / duration) * deviceWidth)
    const middle = deviceHeight / 2
    const selectionStart = selection ? toX(Math.min(selection.start, selection.end)) : -1
    const selectionEnd = selection ? toX(Math.max(selection.start, selection.end)) : -1

    if (selection) {
      context.fillStyle = COLORS.selection
      context.fillRect(selectionStart, 0, Math.max(1, selectionEnd - selectionStart), deviceHeight)
    }

    context.fillStyle = COLORS.axis
    context.fillRect(0, Math.floor(middle), deviceWidth, Math.max(1, Math.round(pixelRatio)))

    peaks.forEach(({ min, max }, x) => {
      context.fillStyle = x >= selectionStart && x <= selectionEnd ? COLORS.waveSelected : COLORS.wave
      const top = middle - max * middle
      const bottom = middle - min * middle
      context.fillRect(x, top, 1, Math.max(1, bottom - top))
    })

    context.fillStyle = COLORS.playhead
    context.fillRect(Math.min(deviceWidth - 2 * pixelRatio, toX(position)), 0, 2 * pixelRatio, deviceHeight)
  }, [peaks, selection, position, duration, deviceWidth, pixelRatio])

  const timeAt = (clientX: number) => {
    const rect = canvasRef.current?.getBoundingClientRect()
    if (!rect || rect.width === 0) return 0
    const fraction = Math.min(Math.max(0, (clientX - rect.left) / rect.width), 1)
    return fraction * duration
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragRef.current = { startX: event.clientX, startTime: timeAt(event.clientX), isDragging: false }
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    if (!drag) return
    if (!drag.isDragging && Math.abs(event.clientX - drag.startX) < DRAG_THRESHOLD_PX) return
    drag.isDragging = true
    const current = timeAt(event.clientX)
    onSelectionChange({ start: Math.min(drag.startTime, current), end: Math.max(drag.startTime, current) })
  }

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current
    dragRef.current = null
    if (!drag || drag.isDragging) return
    onSelectionChange(null)
    onSeek(timeAt(event.clientX))
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const step = event.shiftKey ? 5 : 1
    if (event.key === 'ArrowLeft') onSeek(position - step)
    else if (event.key === 'ArrowRight') onSeek(position + step)
    else if (event.key === 'Home') onSeek(0)
    else if (event.key === 'End') onSeek(duration)
    else return
    event.preventDefault()
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <div ref={containerRef} className="w-full">
        <canvas
          ref={canvasRef}
          role="slider"
          tabIndex={0}
          aria-label="Waveform and playhead position. Drag to select a range."
          aria-valuemin={0}
          aria-valuemax={Math.round(duration * 1000) / 1000}
          aria-valuenow={Math.round(position * 1000) / 1000}
          aria-valuetext={formatTime(position)}
          className="block w-full cursor-crosshair touch-none rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-600"
          style={{ height: HEIGHT_PX }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={() => (dragRef.current = null)}
          onKeyDown={handleKeyDown}
        />
      </div>
      <div className="mt-1 flex justify-between text-xs text-slate-500 tabular-nums dark:text-slate-400">
        <span>{formatTime(0)}</span>
        <span>{formatTime(duration / 2)}</span>
        <span>{formatTime(duration)}</span>
      </div>
    </div>
  )
}
