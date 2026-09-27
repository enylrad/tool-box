import { useEffect, useMemo, useRef, type KeyboardEvent, type PointerEvent } from 'react'
import { useElementSize } from '../../../hooks/useElementSize'
import { usePrefersDarkScheme } from '../../../hooks/usePrefersDarkScheme'
import type { Climb } from '../lib/climbs'
import { pointColorer, type ColorMode } from '../lib/colorScale'
import { formatDistance, formatDuration, formatElevation, formatGrade } from '../lib/format'
import { niceTicks } from '../lib/ticks'
import { indexAtDistance, nearestIndexAtDistance, type TrackAnalysis } from '../lib/trackAnalysis'
import { canvasTheme, prepareCanvas } from './canvasTheme'

interface ElevationProfileProps {
  analysis: TrackAnalysis
  climbs: Climb[]
  colorMode: ColorMode
  hoverIndex: number | null
  onHoverChange: (index: number | null) => void
}

const MARGIN = { top: 12, right: 12, bottom: 22, left: 60 }

/** Elevation against distance, filled with the grade or elevation colors, with climbs shaded. */
export function ElevationProfile({ analysis, climbs, colorMode, hoverIndex, onHoverChange }: ElevationProfileProps) {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()
  const baseCanvasRef = useRef<HTMLCanvasElement>(null)
  const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
  const theme = canvasTheme(usePrefersDarkScheme())
  const { points, stats } = analysis
  const total = stats.distance
  const plotWidth = Math.max(1, width - MARGIN.left - MARGIN.right)
  const plotHeight = Math.max(1, height - MARGIN.top - MARGIN.bottom)

  // Leave some room above and below the track so it does not touch the edges.
  const range = useMemo(() => {
    const min = stats.minEle ?? 0
    const max = stats.maxEle ?? 1
    const padding = Math.max(10, (max - min) * 0.08)
    return { min: Math.max(min < 0 ? -Infinity : 0, min - padding), max: max + padding }
  }, [stats.minEle, stats.maxEle])

  const xOf = (distance: number) => MARGIN.left + (total > 0 ? (distance / total) * plotWidth : 0)
  const yOf = (ele: number) => MARGIN.top + plotHeight - ((ele - range.min) / (range.max - range.min)) * plotHeight

  useEffect(() => {
    const canvas = baseCanvasRef.current
    if (!canvas || width === 0 || height === 0 || !analysis.hasElevation) return
    const context = prepareCanvas(canvas, width, height)
    if (!context) return
    const x = (distance: number) => MARGIN.left + (total > 0 ? (distance / total) * plotWidth : 0)
    const y = (ele: number) => MARGIN.top + plotHeight - ((ele - range.min) / (range.max - range.min)) * plotHeight
    const bottom = MARGIN.top + plotHeight

    context.font = '500 11px ui-sans-serif, system-ui, sans-serif'

    // Climbs, shaded behind everything.
    climbs.forEach((climb, index) => {
      const left = x(climb.startDistance)
      const right = x(climb.startDistance + climb.length)
      context.fillStyle = theme.climbBand
      context.fillRect(left, MARGIN.top, right - left, plotHeight)
      if (right - left > 18) {
        context.fillStyle = theme.mutedText
        context.textAlign = 'center'
        context.textBaseline = 'top'
        context.fillText(`C${index + 1}`, (left + right) / 2, MARGIN.top + 2)
      }
    })

    // Horizontal grid with elevation labels.
    context.strokeStyle = theme.grid
    context.fillStyle = theme.mutedText
    context.lineWidth = 1
    context.textAlign = 'right'
    context.textBaseline = 'middle'
    for (const ele of niceTicks(range.min, range.max, Math.max(2, Math.round(plotHeight / 40)))) {
      const lineY = Math.round(y(ele)) + 0.5
      context.beginPath()
      context.moveTo(MARGIN.left, lineY)
      context.lineTo(MARGIN.left + plotWidth, lineY)
      context.stroke()
      context.fillText(formatElevation(ele), MARGIN.left - 6, lineY)
    }

    // Distance labels.
    context.textAlign = 'center'
    context.textBaseline = 'top'
    const distanceTicks = niceTicks(0, total, Math.max(2, Math.round(plotWidth / 90)))
    for (const distance of distanceTicks) {
      context.fillText(formatDistance(distance), x(distance), bottom + 6)
    }

    // Colored fill, one column per pixel.
    const colorOf = pointColorer(colorMode, stats.minEle, stats.maxEle)
    const columns = Math.ceil(plotWidth)
    const elevationAtColumn: number[] = []
    for (let column = 0; column <= columns; column++) {
      const distance = (column / columns) * total
      const index = indexAtDistance(points, distance)
      const point = points[index]
      const previous = points[index - 1]
      let ele = point.smoothEle!
      if (previous && point.distance > previous.distance) {
        const fraction = (distance - previous.distance) / (point.distance - previous.distance)
        ele = previous.smoothEle! + (point.smoothEle! - previous.smoothEle!) * fraction
      }
      elevationAtColumn.push(ele)
      if (column < columns) {
        context.fillStyle = colorOf(point)
        context.globalAlpha = 0.85
        const top = y(ele)
        context.fillRect(MARGIN.left + column, top, 1.2, bottom - top)
      }
    }
    context.globalAlpha = 1

    // Outline on top.
    context.strokeStyle = theme.profileLine
    context.lineWidth = 1.5
    context.lineJoin = 'round'
    context.beginPath()
    elevationAtColumn.forEach((ele, column) => {
      if (column === 0) context.moveTo(MARGIN.left, y(ele))
      else context.lineTo(MARGIN.left + column, y(ele))
    })
    context.stroke()
  }, [analysis.hasElevation, points, climbs, colorMode, stats.minEle, stats.maxEle, range, total, width, height, plotWidth, plotHeight, theme])

  // Hover crosshair.
  useEffect(() => {
    const canvas = overlayCanvasRef.current
    if (!canvas || width === 0 || height === 0) return
    const context = prepareCanvas(canvas, width, height)
    const point = hoverIndex === null ? undefined : points[hoverIndex]
    if (!context || !point || point.smoothEle === null) return
    const lineX = Math.round(MARGIN.left + (total > 0 ? (point.distance / total) * plotWidth : 0)) + 0.5
    const dotY = MARGIN.top + plotHeight - ((point.smoothEle - range.min) / (range.max - range.min)) * plotHeight
    context.strokeStyle = theme.hover
    context.lineWidth = 1
    context.setLineDash([4, 3])
    context.beginPath()
    context.moveTo(lineX, MARGIN.top)
    context.lineTo(lineX, MARGIN.top + plotHeight)
    context.stroke()
    context.setLineDash([])
    context.fillStyle = theme.hover
    context.strokeStyle = theme.trackOutline
    context.lineWidth = 2
    context.beginPath()
    context.arc(lineX, dotY, 5, 0, Math.PI * 2)
    context.fill()
    context.stroke()
  }, [hoverIndex, points, total, width, height, plotWidth, plotHeight, range, theme])

  const indexAtPointer = (event: PointerEvent<HTMLCanvasElement>) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const fraction = Math.min(1, Math.max(0, (event.clientX - rect.left - MARGIN.left) / plotWidth))
    return nearestIndexAtDistance(points, fraction * total)
  }

  const handleKeyDown = (event: KeyboardEvent<HTMLCanvasElement>) => {
    const step = total * (event.shiftKey ? 0.05 : 0.01)
    const current = hoverIndex === null ? 0 : points[hoverIndex].distance
    let target: number
    if (event.key === 'ArrowRight') target = current + step
    else if (event.key === 'ArrowLeft') target = current - step
    else if (event.key === 'Home') target = 0
    else if (event.key === 'End') target = total
    else if (event.key === 'Escape') {
      onHoverChange(null)
      return
    } else return
    event.preventDefault()
    onHoverChange(nearestIndexAtDistance(points, Math.min(total, Math.max(0, target))))
  }

  if (!analysis.hasElevation) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-sm text-slate-500 dark:text-slate-400">
        This file has no elevation data, so there is no profile to show.
      </div>
    )
  }

  const hovered = hoverIndex === null ? undefined : points[hoverIndex]
  const tooltipX = hovered ? xOf(hovered.distance) : 0
  const tooltipOnLeft = tooltipX > width - 170

  return (
    <div ref={containerRef} className="relative h-full min-h-0 w-full">
      <canvas ref={baseCanvasRef} className="absolute inset-0 size-full" aria-hidden="true" />
      <canvas
        ref={overlayCanvasRef}
        tabIndex={0}
        role="slider"
        aria-label="Elevation profile. Use the arrow keys to move along the route."
        aria-valuemin={0}
        aria-valuemax={Math.round(total)}
        aria-valuenow={Math.round(hovered?.distance ?? 0)}
        aria-valuetext={hovered ? `${formatDistance(hovered.distance)}, ${formatElevation(hovered.ele)}` : 'No point selected'}
        className="absolute inset-0 size-full cursor-crosshair touch-pan-y rounded-md focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-sky-600"
        onPointerMove={(event) => onHoverChange(indexAtPointer(event))}
        onPointerDown={(event) => onHoverChange(indexAtPointer(event))}
        onPointerLeave={(event) => event.pointerType === 'mouse' && onHoverChange(null)}
        onKeyDown={handleKeyDown}
      />
      {hovered && hovered.smoothEle !== null && (
        <div
          className="pointer-events-none absolute z-10 rounded-md bg-white/95 px-2 py-1 text-xs whitespace-nowrap shadow ring-1 ring-slate-200 tabular-nums dark:bg-slate-800/95 dark:ring-slate-700"
          style={{
            top: Math.max(MARGIN.top, Math.min(yOf(hovered.smoothEle) - 60, height - 90)),
            left: tooltipOnLeft ? undefined : tooltipX + 10,
            right: tooltipOnLeft ? width - tooltipX + 10 : undefined,
          }}
        >
          <div className="font-semibold text-slate-900 dark:text-slate-100">{formatElevation(hovered.ele)}</div>
          <div className="text-slate-600 dark:text-slate-300">{formatDistance(hovered.distance)}</div>
          <div className="text-slate-600 dark:text-slate-300">Grade {formatGrade(hovered.grade)}</div>
          {hovered.time !== null && points[0].time !== null && (
            <div className="text-slate-600 dark:text-slate-300">Time {formatDuration(hovered.time - points[0].time)}</div>
          )}
        </div>
      )}
    </div>
  )
}
