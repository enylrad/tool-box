import {
  ACESFilmicToneMapping,
  AnimationMixer,
  AxesHelper,
  Box3,
  Color,
  DirectionalLight,
  GridHelper,
  Group,
  HemisphereLight,
  PerspectiveCamera,
  PMREMGenerator,
  Scene,
  Sphere,
  SRGBColorSpace,
  Timer,
  Vector3,
  WebGLRenderer,
  type AnimationAction,
  type AnimationClip,
  type Material,
  type Object3D,
} from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { disposeObject } from './disposeObject'
import { clipPlanes, fitDistance, gridSizeFor } from './framing'

export type ViewerBackground = 'light' | 'dark' | 'transparent'

const BACKGROUND_COLORS: Record<Exclude<ViewerBackground, 'transparent'>, number> = {
  light: 0xf1f5f9, // slate-100
  dark: 0x0f172a, // slate-900
}

const CAMERA_FOV = 45
/** Camera direction used when a model is framed: slightly above and to the right. */
const VIEW_DIRECTION = new Vector3(1, 0.6, 1.4).normalize()

/**
 * Owns the three.js renderer, camera, controls and lights for one viewport element,
 * and shows one model at a time. Everything it creates is released by `dispose()`.
 */
export class ViewerScene {
  private readonly renderer: WebGLRenderer
  private readonly scene = new Scene()
  private readonly camera = new PerspectiveCamera(CAMERA_FOV, 1, 0.01, 1000)
  private readonly controls: OrbitControls
  private readonly timer = new Timer()
  private readonly resizeObserver: ResizeObserver
  private readonly helpers = new Group()
  private readonly pivot = new Group()
  private model: Object3D | null = null
  private mixer: AnimationMixer | null = null
  private action: AnimationAction | null = null
  private animationClips: readonly AnimationClip[] = []
  private boundingSphere = new Sphere(new Vector3(), 1)
  private wireframe = false
  private showHelpers = true
  private readonly container: HTMLElement

  constructor(container: HTMLElement) {
    this.container = container
    // preserveDrawingBuffer lets a screenshot read the last rendered frame at any time.
    this.renderer = new WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true })
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    this.renderer.outputColorSpace = SRGBColorSpace
    this.renderer.toneMapping = ACESFilmicToneMapping
    this.renderer.domElement.className = 'block size-full touch-none outline-none'
    container.appendChild(this.renderer.domElement)

    const pmrem = new PMREMGenerator(this.renderer)
    const room = new RoomEnvironment()
    this.scene.environment = pmrem.fromScene(room, 0.04).texture
    this.scene.environmentIntensity = 0.8
    room.dispose()
    pmrem.dispose()

    // The environment lights PBR (glTF) materials; these lights cover Phong/Lambert (OBJ/MTL) ones.
    this.scene.add(new HemisphereLight(0xffffff, 0x8d8d8d, 1))
    const sun = new DirectionalLight(0xffffff, 1.2)
    sun.position.set(3, 5, 4)
    this.scene.add(sun, this.helpers, this.pivot)

    this.controls = new OrbitControls(this.camera, this.renderer.domElement)
    this.controls.enableDamping = true
    this.controls.autoRotateSpeed = 1.5

    this.setBackground('light')
    this.rebuildHelpers(1)
    this.frame()

    this.resizeObserver = new ResizeObserver(() => this.resize())
    this.resizeObserver.observe(container)
    this.resize()
    this.timer.connect(document)
    this.renderer.setAnimationLoop((time) => this.render(time))
  }

  /** Replaces the displayed model (disposing the previous one) and frames it. */
  setModel(object: Object3D | null, animations: readonly AnimationClip[] = []) {
    this.clearModel()
    if (!object) return

    // Center the model on the grid and stand it on the floor.
    const box = new Box3().setFromObject(object)
    if (!box.isEmpty()) {
      const center = box.getCenter(new Vector3())
      object.position.sub(new Vector3(center.x, box.min.y, center.z))
    }
    this.pivot.add(object)
    this.model = object
    this.applyWireframe()

    const placed = new Box3().setFromObject(this.pivot)
    this.boundingSphere = placed.isEmpty() ? new Sphere(new Vector3(), 1) : placed.getBoundingSphere(new Sphere())
    const size = placed.isEmpty() ? new Vector3(1, 1, 1) : placed.getSize(new Vector3())
    this.rebuildHelpers(Math.max(size.x, size.z, this.boundingSphere.radius) * 2)
    this.frame()

    if (animations.length > 0) this.mixer = new AnimationMixer(object)
    this.animationClips = animations
  }

  /** Plays one of the current model's animation clips, or stops animation when `index` is null. */
  setAnimation(index: number | null, playing: boolean) {
    const clip = index === null ? undefined : this.animationClips[index]
    if (!this.mixer) return
    if (!clip) {
      this.mixer.stopAllAction()
      this.action = null
      return
    }
    const action = this.mixer.clipAction(clip)
    if (action !== this.action) {
      this.mixer.stopAllAction()
      action.reset().play()
      this.action = action
    }
    action.paused = !playing
  }

  /** Moves the camera back to the default view of the current model. */
  resetView() {
    this.frame()
  }

  setWireframe(enabled: boolean) {
    this.wireframe = enabled
    this.applyWireframe()
  }

  setAutoRotate(enabled: boolean) {
    this.controls.autoRotate = enabled
  }

  setShowHelpers(enabled: boolean) {
    this.showHelpers = enabled
    this.helpers.visible = enabled
  }

  setBackground(background: ViewerBackground) {
    this.scene.background = background === 'transparent' ? null : new Color(BACKGROUND_COLORS[background])
  }

  /** Renders the current view to a PNG, keeping transparency when the background is transparent. */
  capturePng(): Promise<Blob> {
    this.renderer.render(this.scene, this.camera)
    return new Promise((resolve, reject) => {
      this.renderer.domElement.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('Could not capture the image.'))), 'image/png')
    })
  }

  dispose() {
    this.renderer.setAnimationLoop(null)
    this.resizeObserver.disconnect()
    this.timer.dispose()
    this.controls.dispose()
    this.clearModel()
    this.disposeHelpers()
    this.scene.environment?.dispose()
    this.renderer.dispose()
    this.renderer.domElement.remove()
  }

  private clearModel() {
    this.mixer?.stopAllAction()
    if (this.model) this.mixer?.uncacheRoot(this.model)
    this.mixer = null
    this.action = null
    this.animationClips = []
    if (this.model) {
      this.pivot.remove(this.model)
      disposeObject(this.model)
      this.model = null
    }
  }

  private applyWireframe() {
    this.model?.traverse((object) => {
      const material = (object as Object3D & { material?: Material | Material[] }).material
      if (!material) return
      for (const item of Array.isArray(material) ? material : [material]) {
        if ('wireframe' in item) {
          item.wireframe = this.wireframe
          item.needsUpdate = true
        }
      }
    })
  }

  private disposeHelpers() {
    for (const helper of [...this.helpers.children]) {
      this.helpers.remove(helper)
      disposeObject(helper)
    }
  }

  private rebuildHelpers(extent: number) {
    this.disposeHelpers()
    const size = gridSizeFor(extent)
    const grid = new GridHelper(size, 20, 0x94a3b8, 0xcbd5e1)
    const gridMaterials = Array.isArray(grid.material) ? grid.material : [grid.material]
    for (const material of gridMaterials) {
      material.transparent = true
      material.opacity = 0.6
    }
    const axes = new AxesHelper(size / 4)
    axes.position.y = size / 2000 // Avoid z-fighting with the grid.
    this.helpers.add(grid, axes)
    this.helpers.visible = this.showHelpers
  }

  private frame() {
    const { center, radius } = this.boundingSphere
    const distance = fitDistance(radius, CAMERA_FOV, this.camera.aspect)
    const { near, far } = clipPlanes(radius, distance)
    this.camera.near = near
    this.camera.far = far
    this.camera.position.copy(center).addScaledVector(VIEW_DIRECTION, distance)
    this.camera.updateProjectionMatrix()
    this.controls.target.copy(center)
    this.controls.minDistance = radius / 50
    this.controls.maxDistance = distance * 10
    this.controls.update()
  }

  private resize() {
    const width = Math.max(1, this.container.clientWidth)
    const height = Math.max(1, this.container.clientHeight)
    this.renderer.setSize(width, height, false)
    this.camera.aspect = width / height
    this.camera.updateProjectionMatrix()
  }

  private render(time: number) {
    this.timer.update(time)
    const delta = this.timer.getDelta()
    this.mixer?.update(delta)
    this.controls.update(delta)
    this.renderer.render(this.scene, this.camera)
  }
}
