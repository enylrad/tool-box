import { BoxGeometry, BufferGeometry, Float32BufferAttribute, Group, Mesh, MeshStandardMaterial, Texture } from 'three'
import { describe, expect, it } from 'vitest'
import { computeModelStats } from './modelStats'

describe('computeModelStats', () => {
  it('counts meshes, vertices, triangles, materials and textures', () => {
    const material = new MeshStandardMaterial({ map: new Texture(), normalMap: new Texture() })
    const box = new Mesh(new BoxGeometry(2, 4, 6), material)
    const triangle = new BufferGeometry()
    triangle.setAttribute('position', new Float32BufferAttribute([0, 0, 0, 1, 0, 0, 0, 1, 0], 3))
    const flat = new Mesh(triangle, [material, new MeshStandardMaterial()])
    const root = new Group().add(box, new Group().add(flat))

    expect(computeModelStats(root)).toEqual({
      meshes: 2,
      vertices: 24 + 3,
      triangles: 12 + 1,
      materials: 2,
      textures: 2,
      size: { x: 2, y: 4, z: 6 },
    })
  })

  it('reports an empty model', () => {
    expect(computeModelStats(new Group())).toEqual({
      meshes: 0,
      vertices: 0,
      triangles: 0,
      materials: 0,
      textures: 0,
      size: { x: 0, y: 0, z: 0 },
    })
  })
})
