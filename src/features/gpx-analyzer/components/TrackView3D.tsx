import { useEffect, useRef, useState, type PointerEvent } from 'react'
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { Line2 } from 'three/addons/lines/Line2.js'
import { LineGeometry } from 'three/addons/lines/LineGeometry.js'
import { LineMaterial } from 'three/addons/lines/LineMaterial.js'
import { Slider } from '../../../components/form/Slider'
import { useElementSize } from '../../../hooks/useElementSize'
import { usePrefersDarkScheme } from '../../../hooks/usePrefersDarkScheme'
import { pointColorer, type ColorMode } from '../lib/colorScale'
import { sampleIndices } from '../lib/downsample'
import { niceTicks } from '../lib/ticks'
import type { TrackAnalysis } from '../lib/trackAnalysis'
import { END_COLOR, START_COLOR } from './canvasTheme'

interface TrackView3DProps {
  analysis: TrackAnalysis
  colorMode: ColorMode
  hoverIndex: number | null
  onHoverChange: (index: number | null) => void
}

/** More points than this add nothing visible in 3D and only slow down the GPU and hover picking. */
const MAX_3D_POINTS = 4000
const MIN_EXAGGERATION = 1
const MAX_EXAGGERATION = 10

const SCENE_COLORS = {
  light: { background: '#f1f5f9', grid: '#cbd5e1', gridCenter: '#94a3b8', shadow: '#94a3b8' },
  dark: { background: '#0b1120', grid: '#1e293b', gridCenter: '#334155', shadow: '#475569' },
}

interface SceneState {
  renderer: THREE.WebGLRenderer
  scene: THREE.Scene
  camera: THREE.PerspectiveCamera
  controls: OrbitControls
  track: THREE.Group
  marker: THREE.Group
  lineMaterials: LineMaterial[]
  /** Curtain mesh used for hover picking, and the first and last point index of each of its quads. */
  pickMesh: THREE.Mesh | null
  quadPoints: [number, number][]
  render: () => void
}

function horizontalExtent(analysis: TrackAnalysis) {
  const { bounds } = analysis
  return Math.max(50, bounds.maxX - bounds.minX, bounds.maxY - bounds.minY)
}

/** An exaggeration that makes the relief about 12 % of the route's width, so hills are visible but not spiky. */
function defaultExaggeration(analysis: TrackAnalysis): number {
  const relief = (analysis.stats.maxEle ?? 0) - (analysis.stats.minEle ?? 0)
  if (relief <= 0) return MIN_EXAGGERATION
  const ideal = (horizontalExtent(analysis) * 0.12) / relief
  return Math.min(5, Math.max(MIN_EXAGGERATION, Math.round(ideal * 2) / 2))
}

function isWebglAvailable() {
  try {
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    // Release the probe context right away; browsers limit how many can be alive.
    context?.getExtension('WEBGL_lose_context')?.loseContext()
    return context !== null
  } catch {
    return false
  }
}

function disposeObject(object: THREE.Object3D) {
  object.traverse((child) => {
    const disposable = child as Partial<THREE.Mesh>
    disposable.geometry?.dispose()
    const material = disposable.material
    if (Array.isArray(material)) material.forEach((item) => item.dispose())
    else material?.dispose()
  })
}

/** Rotatable 3D view of the route as a colored "curtain" hanging from the elevation line down to the ground. */
export default function TrackView3D({ analysis, colorMode, hoverIndex, onHoverChange }: TrackView3DProps) {
  const [containerRef, { width, height }] = useElementSize<HTMLDivElement>()
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<SceneState | null>(null)
  const pointerDownRef = useRef<{ x: number; y: number } | null>(null)
  const isDark = usePrefersDarkScheme()
  const [exaggeration, setExaggeration] = useState(() => defaultExaggeration(analysis))
  const [hasWebgl] = useState(isWebglAvailable)

  const { points, bounds, stats } = analysis
  const centerX = (bounds.minX + bounds.maxX) / 2
  const centerY = (bounds.minY + bounds.maxY) / 2
  const extent = horizontalExtent(analysis)
  const relief = (stats.maxEle ?? 0) - (stats.minEle ?? 0)
  // The ground sits a little below the lowest point so the curtain is never zero-height.
  const floorEle = (stats.minEle ?? 0) - Math.max(relief * 0.08, 5)
  const heightOf = (ele: number | null) => (ele === null ? extent * 0.01 : (ele - floorEle) * exaggeration)

  // Renderer, camera and controls live for the whole lifetime of the component.
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true })
    } catch {
      // WebGL exists but the context could not be created (e.g. GPU blocklisted); the canvas stays empty.
      return
    }
    renderer.setPixelRatio(window.devicePixelRatio || 1)
    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000)
    const controls = new OrbitControls(camera, canvas)
    controls.maxPolarAngle = Math.PI / 2 - 0.02
    const track = new THREE.Group()
    const marker = new THREE.Group()
    marker.visible = false
    scene.add(track, marker)
    const state: SceneState = {
      renderer,
      scene,
      camera,
      controls,
      track,
      marker,
      lineMaterials: [],
      pickMesh: null,
      quadPoints: [],
      render: () => renderer.render(scene, camera),
    }
    controls.addEventListener('change', state.render)
    stateRef.current = state
    return () => {
      controls.removeEventListener('change', state.render)
      controls.dispose()
      disposeObject(scene)
      renderer.dispose()
      stateRef.current = null
    }
  }, [])

  // Camera: frame the whole route from the south-west, only when a new route is loaded.
  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    const { camera, controls } = state
    camera.near = extent / 2000
    camera.far = extent * 50
    camera.position.set(-extent * 0.55, extent * 0.7, extent * 0.85)
    controls.target.set(0, 0, 0)
    controls.minDistance = extent * 0.02
    controls.maxDistance = extent * 8
    camera.updateProjectionMatrix()
    controls.update()
    state.render()
  }, [analysis, extent])

  // Track geometry, rebuilt when the colors, exaggeration or theme change.
  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    const { track, scene } = state
    disposeObject(track)
    track.clear()
    state.lineMaterials = []

    const colors = isDark ? SCENE_COLORS.dark : SCENE_COLORS.light
    scene.background = new THREE.Color(colors.background)

    const colorOf = pointColorer(colorMode, stats.minEle, stats.maxEle)
    const samples = sampleIndices(points, MAX_3D_POINTS)
    const toX = (index: number) => points[index].x - centerX
    const toZ = (index: number) => -(points[index].y - centerY)
    const toY = (index: number) => heightOf(points[index].smoothEle)

    // Ground grid covering the route.
    const cell = niceTicks(0, extent, 8)[1] ?? extent / 8
    const size = Math.ceil((extent * 1.2) / cell) * cell
    const grid = new THREE.GridHelper(size, Math.round(size / cell), colors.gridCenter, colors.grid)
    track.add(grid)

    // Curtain: two vertices (ground, track) per sample, two triangles per consecutive pair in the same segment.
    const positions: number[] = []
    const vertexColors: number[] = []
    const indices: number[] = []
    const quadPoints: [number, number][] = []
    const color = new THREE.Color()
    samples.forEach((index, sampleNumber) => {
      color.set(colorOf(points[index]))
      positions.push(toX(index), 0, toZ(index), toX(index), toY(index), toZ(index))
      vertexColors.push(color.r * 0.25, color.g * 0.25, color.b * 0.25, color.r, color.g, color.b)
      const previous = samples[sampleNumber - 1]
      if (previous !== undefined && points[previous].segment === points[index].segment) {
        const base = (sampleNumber - 1) * 2
        indices.push(base, base + 2, base + 1, base + 1, base + 2, base + 3)
        quadPoints.push([previous, index])
      }
    })
    const curtainGeometry = new THREE.BufferGeometry()
    curtainGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    curtainGeometry.setAttribute('color', new THREE.Float32BufferAttribute(vertexColors, 3))
    curtainGeometry.setIndex(indices)
    const curtain = new THREE.Mesh(
      curtainGeometry,
      new THREE.MeshBasicMaterial({ vertexColors: true, side: THREE.DoubleSide, transparent: true, opacity: 0.8, depthWrite: false }),
    )
    track.add(curtain)
    state.pickMesh = curtain
    state.quadPoints = quadPoints

    // A thick line along the top and its shadow on the ground, one per segment.
    const bySegment = new Map<number, number[]>()
    for (const index of samples) {
      const list = bySegment.get(points[index].segment) ?? []
      list.push(index)
      bySegment.set(points[index].segment, list)
    }
    const resolution = new THREE.Vector2(Math.max(1, width), Math.max(1, height))
    for (const segmentSamples of bySegment.values()) {
      if (segmentSamples.length < 2) continue
      const linePositions: number[] = []
      const lineColors: number[] = []
      const shadowPositions: number[] = []
      for (const index of segmentSamples) {
        color.set(colorOf(points[index]))
        linePositions.push(toX(index), toY(index), toZ(index))
        lineColors.push(color.r, color.g, color.b)
        shadowPositions.push(toX(index), 0, toZ(index))
      }
      const lineGeometry = new LineGeometry()
      lineGeometry.setPositions(linePositions)
      lineGeometry.setColors(lineColors)
      const lineMaterial = new LineMaterial({ linewidth: 3, vertexColors: true, resolution })
      state.lineMaterials.push(lineMaterial)
      track.add(new Line2(lineGeometry, lineMaterial))

      const shadowGeometry = new THREE.BufferGeometry()
      shadowGeometry.setAttribute('position', new THREE.Float32BufferAttribute(shadowPositions, 3))
      track.add(new THREE.Line(shadowGeometry, new THREE.LineBasicMaterial({ color: colors.shadow })))
    }

    // Start and finish flags: a pole and a ball.
    const addFlag = (index: number, flagColor: string) => {
      const top = toY(index) + extent * 0.03
      const pole = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(toX(index), 0, toZ(index)), new THREE.Vector3(toX(index), top, toZ(index))])
      track.add(new THREE.Line(pole, new THREE.LineBasicMaterial({ color: flagColor })))
      const ball = new THREE.Mesh(new THREE.SphereGeometry(extent * 0.008, 16, 12), new THREE.MeshBasicMaterial({ color: flagColor }))
      ball.position.set(toX(index), top, toZ(index))
      track.add(ball)
    }
    addFlag(points.length - 1, END_COLOR)
    addFlag(0, START_COLOR)

    state.render()
    // heightOf depends on exaggeration and the route, which are already listed.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points, colorMode, exaggeration, isDark, stats.minEle, stats.maxEle, centerX, centerY, extent])

  // Hover marker: a vertical line and a ball at the hovered point.
  useEffect(() => {
    const state = stateRef.current
    if (!state) return
    const { marker } = state
    disposeObject(marker)
    marker.clear()
    const point = hoverIndex === null ? undefined : points[hoverIndex]
    marker.visible = point !== undefined
    if (point) {
      const x = point.x - centerX
      const z = -(point.y - centerY)
      const top = heightOf(point.smoothEle)
      const markerColor = isDark ? '#f8fafc' : '#0f172a'
      const line = new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x, 0, z), new THREE.Vector3(x, top, z)])
      marker.add(new THREE.Line(line, new THREE.LineBasicMaterial({ color: markerColor })))
      const ball = new THREE.Mesh(new THREE.SphereGeometry(extent * 0.007, 16, 12), new THREE.MeshBasicMaterial({ color: markerColor }))
      ball.position.set(x, top, z)
      marker.add(ball)
    }
    state.render()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hoverIndex, points, exaggeration, isDark, centerX, centerY, extent])

  // Keep the drawing buffer and fat lines in sync with the element size.
  useEffect(() => {
    const state = stateRef.current
    if (!state || width === 0 || height === 0) return
    state.renderer.setSize(width, height, false)
    state.camera.aspect = width / height
    state.camera.updateProjectionMatrix()
    for (const material of state.lineMaterials) material.resolution.set(width, height)
    state.render()
  }, [width, height])

  const pickPoint = (event: PointerEvent<HTMLCanvasElement>): number | null => {
    const state = stateRef.current
    if (!state?.pickMesh) return null
    const rect = event.currentTarget.getBoundingClientRect()
    const pointer = new THREE.Vector2(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1)
    const raycaster = new THREE.Raycaster()
    raycaster.setFromCamera(pointer, state.camera)
    const hit = raycaster.intersectObject(state.pickMesh)[0]
    if (!hit || hit.faceIndex === undefined || hit.faceIndex === null) return null
    const [first, last] = state.quadPoints[hit.faceIndex >> 1]
    // A quad can span several original points when the track was downsampled; pick the closest one.
    let best = first
    let bestDistance = Infinity
    for (let index = first; index <= last; index++) {
      const distance = Math.hypot(points[index].x - centerX - hit.point.x, -(points[index].y - centerY) - hit.point.z)
      if (distance < bestDistance) {
        bestDistance = distance
        best = index
      }
    }
    return best
  }

  const resetCamera = () => {
    const state = stateRef.current
    if (!state) return
    state.camera.position.set(-extent * 0.55, extent * 0.7, extent * 0.85)
    state.controls.target.set(0, 0, 0)
    state.controls.update()
    state.render()
  }

  if (!hasWebgl) {
    return (
      <div className="flex h-full items-center justify-center p-4 text-center text-sm text-slate-500 dark:text-slate-400">
        3D needs WebGL, which is not available in this browser. The 2D view still works.
      </div>
    )
  }

  return (
    <div ref={containerRef} className="relative h-full min-h-0 w-full overflow-hidden">
      <canvas
        ref={canvasRef}
        className="absolute inset-0 size-full cursor-grab touch-none active:cursor-grabbing"
        role="img"
        aria-label="3D view of the route. Drag to rotate, right-drag or two fingers to pan, scroll or pinch to zoom."
        onPointerDown={(event) => (pointerDownRef.current = { x: event.clientX, y: event.clientY })}
        onPointerMove={(event) => {
          if (event.pointerType === 'mouse' && event.buttons === 0) onHoverChange(pickPoint(event))
        }}
        onPointerUp={(event) => {
          const down = pointerDownRef.current
          pointerDownRef.current = null
          // A tap without dragging selects a point (touch has no hover).
          if (down && Math.hypot(event.clientX - down.x, event.clientY - down.y) < 4) onHoverChange(pickPoint(event))
        }}
        onPointerLeave={(event) => event.pointerType === 'mouse' && onHoverChange(null)}
      />
      <div className="absolute bottom-3 left-3 w-52 rounded-lg bg-white/90 px-3 py-2 shadow ring-1 ring-slate-200 dark:bg-slate-800/90 dark:ring-slate-700">
        <Slider
          label="Vertical exaggeration"
          value={exaggeration}
          min={MIN_EXAGGERATION}
          max={MAX_EXAGGERATION}
          step={0.5}
          onChange={setExaggeration}
          formatValue={(value) => `${value}×`}
        />
      </div>
      <button
        type="button"
        onClick={resetCamera}
        className="absolute top-3 left-3 rounded-md bg-white/90 px-2.5 py-1 text-xs font-medium text-slate-700 shadow ring-1 ring-slate-200 hover:bg-white dark:bg-slate-800/90 dark:text-slate-200 dark:ring-slate-700 dark:hover:bg-slate-800"
      >
        Reset view
      </button>
      <p className="pointer-events-none absolute top-3 right-3 hidden rounded-md bg-white/80 px-2 py-1 text-xs text-slate-500 lg:block dark:bg-slate-900/80 dark:text-slate-400">
        Drag to rotate · Right-drag to pan · Scroll to zoom
      </p>
    </div>
  )
}
