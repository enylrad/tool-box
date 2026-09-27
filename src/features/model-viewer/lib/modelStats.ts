import { Box3, Vector3, type BufferGeometry, type Material, type Object3D, type Texture } from 'three'

export interface ModelStats {
  meshes: number
  vertices: number
  triangles: number
  materials: number
  textures: number
  /** Size of the axis-aligned bounding box, in model units. */
  size: { x: number; y: number; z: number }
}

interface MeshLike extends Object3D {
  isMesh: true
  geometry: BufferGeometry
  material: Material | Material[]
  isInstancedMesh?: boolean
  count?: number
}

function isMesh(object: Object3D): object is MeshLike {
  return (object as Partial<MeshLike>).isMesh === true
}

function trianglesOf(geometry: BufferGeometry) {
  const position = geometry.getAttribute('position')
  if (!position) return 0
  const count = geometry.index ? geometry.index.count : position.count
  return Math.floor(count / 3)
}

function texturesOf(material: Material) {
  return Object.values(material).filter((value): value is Texture => (value as Partial<Texture> | null)?.isTexture === true)
}

/** Counts what a loaded model is made of and measures its bounding box. */
export function computeModelStats(root: Object3D): ModelStats {
  let meshes = 0
  let vertices = 0
  let triangles = 0
  const materials = new Set<Material>()
  const textures = new Set<Texture>()

  root.traverse((object) => {
    if (!isMesh(object)) return
    meshes++
    const instances = object.isInstancedMesh ? (object.count ?? 1) : 1
    vertices += (object.geometry.getAttribute('position')?.count ?? 0) * instances
    triangles += trianglesOf(object.geometry) * instances
    for (const material of Array.isArray(object.material) ? object.material : [object.material]) {
      materials.add(material)
      for (const texture of texturesOf(material)) textures.add(texture)
    }
  })

  const box = new Box3().setFromObject(root)
  const size = box.isEmpty() ? new Vector3() : box.getSize(new Vector3())
  return { meshes, vertices, triangles, materials: materials.size, textures: textures.size, size: { x: size.x, y: size.y, z: size.z } }
}
