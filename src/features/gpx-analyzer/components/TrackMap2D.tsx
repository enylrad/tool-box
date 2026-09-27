import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { useElementSize } from '../../../hooks/useElementSize'
import { usePrefersDarkScheme } from '../../../hooks/usePrefersDarkScheme'
import type { ColorMode } from '../lib/colorScale'
import { pointColorer } from '../lib/colorScale'
import { formatDistance, formatElevation } from '../lib/format'
import { niceTicks } from '../lib/ticks'
import type { TrackAnalysis } from '../lib/trackAnalysis'
import { END_COLOR, START_COLOR, canvasTheme, drawLabel, prepareCanvas } from './canvasTheme'

interface TrackMap2DProps {
  analysis: TrackAnalysis
  colorMode: ColorMode
  hoverIndex: number | null
  onHoverChange: (index: number | null) => void
}

interface View {
  zoom: number
  panX: number
  panY: number
}

const PADDING_PX = 32
const MIN_ZOOM = 0.5
const MAX_ZOOM = 200
/** The pointer must be this close (CSS px) to the track to highlight a point. */
const HOVER_RADIUS_PX = 28
const RESET_VIEW: View = { zoom: 1, panX: 0, panY: 0 }

/** Distance between kilometer markers so there are at most ~12 of them. */
function markerSpacing(totalMeters: number): number {
  const steps = [1000, 2000, 5000, 10_000, 20_000, 50_000, 100_000]
  return steps.find((step) => totalMeters / step <= 12) ?? 200_000
}

/** Top-down drawing of the route with zoom, pan and hover. No map tiles: nothing is downloaded. */
export function TrackMap2D({ analysis, colorMode, hoverIndex, onHoverChange }: TrackMap2DProps) {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()
  const baseCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const isDark = usePrefersDarkScheme()
  const theme = canvasTheme(isDark)
  const [view, setView] = useState<View>(RESET_VIEW)
  const pointersRef = useRef(new Map<number, { x: number; y: number }>())
  const gestureRef = useRef<{ moved: boolean; pinchDistance: number | null }>({ moved: false, pinchDistance: null })

  const { points, bounds, stats } = analysis
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  const fitScale = Math.min(
    (width - PADDING_PX * 2) / Math.max(1, bounds.maxX - bounds.minX),
    (height - PADDING_PX * 2) / Math.max(1, bounds.maxY - bounds.minY),
  )
  const scale = Math.max(1e-6, fitScale) * view.zoom
  const toScreenX = (x: number) => width / 2 + (x - centerX) * scale + view.panX
  const toScreenY = (y: number) => height / 2 - (y - centerY) * scale + view.panY

  const colors = useMemo(() => {
    const colorOf = pointColorer(colorMode, stats.minEle, stats.maxEle)
    return points.map(colorOf)
  }, [points, colorMode, stats.minEle, stats.maxEle])

  // Base layer: grid, track, markers. Redrawn on view, size or color changes, not on hover.
  useEffect(() => {
    const canvas = baseCanvasRef.current
    if (!canvas || width === 0 || height === 0) return
    const context = prepareCanvas(canvas, width, height)
    if (!context) return
    const sx = (x: number) => width / 2 + (x - centerX) * scale + view.panX
    const sy = (y: number) => height / 2 - (y - centerY) * scale + view.panY

    // Grid in meters, labeled along the edges.
    const worldLeft = centerX + (0 - width / 2 - view.panX) / scale
    const worldRight = centerX + (width - width / 2 - view.panX) / scale
    const worldTop = centerY - (0 - height / 2 - view.panY) / scale
    const worldBottom = centerY - (height - height / 2 - view.panY) / scale
    const gridCount = Math.max(2, Math.round(Math.max(width, height) / 110))
    const gridX = niceTicks(worldLeft, worldRight, gridCount)
    const gridStep = gridX.length > 1 ? gridX[1] - gridX[0] : 1000
    context.strokeStyle = theme.grid
    context.lineWidth = 1
    context.beginPath()
    for (const x of gridX) {
      context.moveTo(Math.round(sx(x)) + 0.5, 0)
      context.lineTo(Math.round(sx(x)) + 0.5, height)
    }
    for (let y = Math.ceil(worldBottom / gridStep) * gridStep; y <= worldTop; y += gridStep) {
      context.moveTo(0, Math.round(sy(y)) + 0.5)
      context.lineTo(width, Math.round(sy(y)) + 0.5)
    }
    context.stroke()

    // Track: a contrasting outline, then colored runs (one path per run of the same color).
    context.lineJoin = 'round'
    context.lineCap = 'round'
    const trace = (withColor: boolean) => {
      let currentColor = ''
      let lastX = NaN
      let lastY = NaN
      const restartPath = (x: number, y: number, color: string) => {
        context.stroke()
        currentColor = color
        if (withColor) context.strokeStyle = color
        context.beginPath()
        context.moveTo(x, y)
      }
      context.beginPath()
      for (let index = 0; index < points.length; index++) {
        const x = sx(points[index].x)
        const y = sy(points[index].y)
        const startsSegment = index === 0 || points[index].segment !== points[index - 1].segment
        const changesColor = withColor && colors[index] !== currentColor
        if (startsSegment) {
          restartPath(x, y, colors[index])
        } else if (changesColor) {
          context.lineTo(x, y)
          restartPath(x, y, colors[index])
        } else if (Math.abs(x - lastX) >= 0.5 || Math.abs(y - lastY) >= 0.5 || index === points.length - 1) {
          // Points closer than half a pixel add nothing visible; skipping them keeps long tracks fast.
          context.lineTo(x, y)
        } else {
          continue
        }
        lastX = x
        lastY = y
      }
      context.stroke()
    }
    context.strokeStyle = theme.trackOutline
    context.lineWidth = 7
    trace(false)
    context.lineWidth = 4
    trace(true)

    // Kilometer markers.
    const spacing = markerSpacing(stats.distance)
    let nextMarker = spacing
    for (const point of points) {
      if (point.distance < nextMarker) continue
      if (stats.distance - point.distance > spacing * 0.3) {
        const x = sx(point.x)
        const y = sy(point.y)
        context.fillStyle = theme.labelBackground
        context.strokeStyle = theme.text
        context.lineWidth = 1.5
        context.beginPath()
        context.arc(x, y, 3.5, 0, Math.PI * 2)
        context.fill()
        context.stroke()
        drawLabel(context, `${Math.round(nextMarker / 1000)} km`, x + 7, y - 10, theme)
      }
      nextMarker += spacing
    }

    // Start and end.
    const drawEndpoint = (index: number, color: string, label: string) => {
      const x = sx(points[index].x)
      const y = sy(points[index].y)
      context.fillStyle = color
      context.strokeStyle = '#ffffff'
      context.lineWidth = 2
      context.beginPath()
      context.arc(x, y, 7, 0, Math.PI * 2)
      context.fill()
      context.stroke()
      context.fillStyle = '#ffffff'
      context.font = '700 9px ui-sans-serif, system-ui, sans-serif'
      context.textAlign = 'center'
      context.textBaseline = 'middle'
      context.fillText(label, x, y + 0.5)
    }
    drawEndpoint(points.length - 1, END_COLOR, 'F')
    drawEndpoint(0, START_COLOR, 'S')

    // Scale bar (bottom left) and north arrow (top right).
    const barMeters = niceTicks(0, 120 / scale, 2)[1] ?? 100
    const barPixels = barMeters * scale
    context.strokeStyle = theme.text
    context.lineWidth = 2
    context.beginPath()
    context.moveTo(12, height - 14)
    context.lineTo(12, height - 10)
    context.lineTo(12 + barPixels, height - 10)
    context.lineTo(12 + barPixels, height - 14)
    context.stroke()
    context.fillStyle = theme.text
    context.font = '500 11px ui-sans-serif, system-ui, sans-serif'
    context.textAlign = 'left'
    context.textBaseline = 'bottom'
    context.fillText(formatDistance(barMeters), 12, height - 16)

    context.fillStyle = theme.text
    context.beginPath()
    context.moveTo(width - 20, 12)
    context.lineTo(width - 26, 28)
    context.lineTo(width - 20, 24)
    context.lineTo(width - 14, 28)
    context.closePath()
    context.fill()
    context.textAlign = 'center'
    context.textBaseline = 'top'
    context.fillText('N', width - 20, 30)
  }, [points, colors, width, height, scale, view, centerX, centerY, theme, stats.distance])

  // Overlay layer: only the hovered point.
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas || width === 0 || height === 0) return
    const context = prepareCanvas(canvas, width, height)
    if (!context || hoverIndex === null || !points[hoverIndex]) return
    const point = points[hoverIndex]
    const x = width / 2 + (point.x - centerX) * scale + view.panX
    const y = height / 2 - (point.y - centerY) * scale + view.panY
    context.fillStyle = theme.hover
    context.strokeStyle = theme.trackOutline
    context.lineWidth = 3
    context.beginPath()
    context.arc(x, y, 6, 0, Math.PI * 2)
    context.stroke()
    context.fill()
    const label = point.ele === null ? formatDistance(point.distance) : `${formatDistance(point.distance)} · ${formatElevation(point.ele)}`
    drawLabel(context, label, x, y - 18, theme, x > width - 120 ? 'right' : x < 120 ? 'left' : 'center')
  }, [hoverIndex, points, width, height, scale, view, centerX, centerY, theme])

  // Wheel zoom around the pointer. React's onWheel is passive, so preventDefault needs a native listener.
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas) return
    const handleWheel = (event: WheelEvent) => {
      event.preventDefault()
      const rect = canvas.getBoundingClientRect()
      const factor = Math.exp(-event.deltaY * (event.deltaMode === 1 ? 0.05 : 0.0015))
      zoomAround(event.clientX - rect.left, event.clientY - rect.top, factor)
    }
    canvas.addEventListener('wheel', handleWheel, { passive: false })
    return () => canvas.removeEventListener('wheel', handleWheel)
  })

  function zoomAround(screenX: number, screenY: number, factor: number) {
    setView((current) => {
      const zoom = Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, current.zoom * factor))
      const applied = zoom / current.zoom
      // Keep the world point under the cursor fixed.
      const offsetX = screenX - width / 2
      const offsetY = screenY - height / 2
      return {
        zoom,
        panX: offsetX - (offsetX - current.panX) * applied,
        panY: offsetY - (offsetY - current.panY) * applied,
      }
    })
  }

  const nearestPoint = (screenX: number, screenY: number): number | null => {
    let best: number | null = null
    let bestDistance = HOVER_RADIUS_PX ** 2
    for (let index = 0; index < points.length; index++) {
      const dx = toScreenX(points[index].x) - screenX
      const dy = toScreenY(points[index].y) - screenY
      const distance = dx * dx + dy * dy
      if (distance < bestDistance) {
        bestDistance = distance
        best = index
      }
    }
    return best
  }

  const localPosition = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    return { x: event.clientX - rect.left, y: event.clientY - rect.top }
  }

  const handlePointerDown = (event: PointerEvent<HTMLCanvasElement>) => {
    event.currentTarget.setPointerCapture(event.pointerId)
    pointersRef.current.set(event.pointerId, localPosition(event))
    gestureRef.current = { moved: false, pinchDistance: null }
  }

  const handlePointerMove = (event: PointerEvent<HTMLCanvasElement>) => {
    const position = localPosition(event)
    const pointers = pointersRef.current
    const previous = pointers.get(event.pointerId)
    if (!previous) {
      if (event.pointerType === 'mouse') onHoverChange(nearestPoint(position.x, position.y))
      return
    }
    pointers.set(event.pointerId, position)
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()]
      const distance = Math.hypot(a.x - b.x, a.y - b.y)
      const gesture = gestureRef.current
      if (gesture.pinchDistance) zoomAround((a.x + b.x) / 2, (a.y + b.y) / 2, distance / gesture.pinchDistance)
      gesture.pinchDistance = distance
      gesture.moved = true
      return
    }
    const dx = position.x - previous.x
    const dy = position.y - previous.y
    if (!gestureRef.current.moved && Math.hypot(dx, dy) < 3) return
    gestureRef.current.moved = true
    setView((current) => ({ ...current, panX: current.panX + dx, panY: current.panY + dy }))
  }

  const handlePointerUp = (event: PointerEvent<HTMLCanvasElement>) => {
    const position = localPosition(event)
    pointersRef.current.delete(event.pointerId)
    if (pointersRef.current.size < 2) gestureRef.current.pinchDistance = null
    // A tap (no drag) selects the nearest point, which is how touch users "hover".
    if (!gestureRef.current.moved) onHoverChange(nearestPoint(position.x, position.y))
  }

  const zoomButtonClass =
    'flex size-8 items-center justify-center rounded-md bg-white/90 text-lg font-medium text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white dark:bg-slate-800/90 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800'

  return (
    <div ref={containerRef} className="relative h-full min-h-0 w-full overflow-hidden">
      <canvas ref={baseCanvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
      <canvas
        ref={overlayCanvasRef}
        className="absolute inset-0 size-full cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label={`Route drawn from above, ${formatDistance(stats.distance)} long. Drag to pan, scroll or pinch to zoom.`}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={(event) => pointersRef.current.delete(event.pointerId)}
        onPointerLeave={(event) => event.pointerType === 'mouse' && onHoverChange(null)}
        onDoubleClick={() => setView(RESET_VIEW)}
      />
      <div className="absolute top-3 left-3 flex flex-col gap-1">
        <button type="button" className={zoomButtonClass} aria-label="Zoom in" onClick={() => zoomAround(width / 2, height / 2, 1.5)}>
          +
        </button>
        <button type="button" className={zoomButtonClass} aria-label="Zoom out" onClick={() => zoomAround(width / 2, height / 2, 1 / 1.5)}>
          −
        </button>
        <button type="button" className={`${zoomButtonClass} text-xs`} aria-label="Fit the whole route" title="Fit the whole route" onClick={() => setView(RESET_VIEW)}>
          ⤢
        </button>
      </div>
    </div>
  )
}
