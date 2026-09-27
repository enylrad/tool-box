import { LoadingManager, MeshStandardMaterial, type AnimationClip, type Material, type Mesh, type Object3D } from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js'
import { classifyFiles, type ModelFormat } from './classifyFiles'
import { computeModelStats, type ModelStats } from './modelStats'
import { findMaterialLibraries } from './objMaterials'
import { ResourceResolver } from './resourceResolver'

export interface LoadedModel {
  fileName: string
  format: ModelFormat
  object: Object3D
  animations: AnimationClip[]
  stats: ModelStats
  /** Files the model referenced that were not dropped with it. */
  missing: string[]
  /** Releases the object URLs created for the model's resources. */
  revokeUrls: () => void
}

function describeError(error: unknown, missing: readonly string[]) {
  const message = error instanceof Error ? error.message : String(error)
  if (message.includes('DRACOLoader')) {
    return 'This glTF uses Draco mesh compression, which is not supported yet. Re-export it without Draco compression.'
  }
  if (message.includes('KTX2')) {
    return 'This glTF uses KTX2 (Basis Universal) textures, which are not supported yet. Re-export it with PNG or JPEG textures.'
  }
  if (missing.length > 0) {
    const plural = missing.length > 1
    return `Missing file${plural ? 's' : ''}: ${missing.join(', ')}. Drop ${plural ? 'them' : 'it'} together with the model.`
  }
  if (error instanceof SyntaxError || /JSON|Unexpected token/i.test(message)) {
    return 'The file could not be read as a glTF model. It may be damaged.'
  }
  return `Could not open the model: ${message}`
}

async function loadGltf(main: File, manager: LoadingManager) {
  const loader = new GLTFLoader(manager).setMeshoptDecoder(MeshoptDecoder)
  // An empty path makes relative URIs reach the URL modifier untouched.
  const gltf = await loader.parseAsync(await main.arrayBuffer(), '')
  return { object: gltf.scene ?? gltf.scenes[0], animations: gltf.animations }
}

async function loadObj(main: File, manager: LoadingManager, resolver: ResourceResolver) {
  const text = await main.text()
  const loader = new OBJLoader(manager)

  const libraries: string[] = []
  for (const name of findMaterialLibraries(text)) {
    const file = resolver.findFile(name)
    if (file) libraries.push(await file.text())
    else resolver.markMissing(name)
  }
  if (libraries.length > 0) {
    const materials = new MTLLoader(manager).parse(libraries.join('\n'), '')
    materials.preload()
    loader.setMaterials(materials)
  }

  const object: Object3D = loader.parse(text)
  if (libraries.length === 0) applyDefaultMaterial(object)
  return { object, animations: [] as AnimationClip[] }
}

/** Gives an OBJ without materials a neutral PBR look instead of OBJLoader's flat white Phong. */
function applyDefaultMaterial(root: Object3D) {
  const plain = new MeshStandardMaterial({ color: 0xb4bcc6, roughness: 0.55, metalness: 0.1 })
  const colored = new MeshStandardMaterial({ roughness: 0.55, metalness: 0.1, vertexColors: true })
  root.traverse((object) => {
    const mesh = object as Mesh
    if (!mesh.isMesh) return
    for (const material of ([] as Material[]).concat(mesh.material)) material.dispose()
    mesh.material = mesh.geometry.hasAttribute('color') ? colored : plain
  })
}

/** Opens a dropped model (and the resources dropped with it) as a three.js object tree. */
export async function loadModel(files: readonly File[]): Promise<LoadedModel> {
  const { main, format, resources } = classifyFiles(files)
  const resolver = new ResourceResolver(resources)
  const manager = new LoadingManager()
  manager.setURLModifier(resolver.resolve)

  try {
    const { object, animations } = format === 'obj' ? await loadObj(main, manager, resolver) : await loadGltf(main, manager)
    if (!object) throw new Error('The file does not contain any scene.')
    return {
      fileName: main.name,
      format,
      object,
      animations,
      stats: computeModelStats(object),
      missing: resolver.missing,
      revokeUrls: () => resolver.revokeAll(),
    }
  } catch (error) {
    resolver.revokeAll()
    throw new Error(describeError(error, resolver.missing), { cause: error })
  }
}
