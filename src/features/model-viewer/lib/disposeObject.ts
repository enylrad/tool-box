import type { BufferGeometry, Material, Object3D, Texture } from 'three'

interface Disposable extends Object3D {
  geometry?: BufferGeometry
  material?: Material | Material[]
}

/** Frees the GPU resources (geometries, materials and textures) held by an object tree. */
export function disposeObject(root: Object3D) {
  const materials = new Set<Material>()
  root.traverse((object) => {
    const { geometry, material } = object as Disposable
    geometry?.dispose()
    if (material) for (const item of Array.isArray(material) ? material : [material]) materials.add(item)
  })
  for (const material of materials) {
    for (const value of Object.values(material)) {
      if ((value as Partial<Texture> | null)?.isTexture) (value as Texture).dispose()
    }
    material.dispose()
  }
}
