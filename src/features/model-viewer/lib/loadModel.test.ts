import type { Mesh, MeshPhongMaterial, MeshStandardMaterial } from 'three'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { loadModel } from './loadModel'

const CUBE_OBJ = `mtllib cube.mtl
v 0 0 0
v 1 0 0
v 1 1 0
v 0 1 0
v 0 0 1
v 1 0 1
v 1 1 1
v 0 1 1
usemtl red
f 1 2 3 4
f 5 8 7 6
f 1 5 6 2
f 2 6 7 3
f 3 7 8 4
f 5 1 4 8
`

const CUBE_MTL = `newmtl red
Kd 1 0 0
`

/** A glTF with one triangle whose buffer is embedded as a data URI. */
function triangleGltf(bufferUri: string) {
  return JSON.stringify({
    asset: { version: '2.0' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ mesh: 0 }],
    meshes: [{ primitives: [{ attributes: { POSITION: 0 } }] }],
    buffers: [{ uri: bufferUri, byteLength: 36 }],
    bufferViews: [{ buffer: 0, byteLength: 36 }],
    accessors: [{ bufferView: 0, componentType: 5126, count: 3, type: 'VEC3', min: [0, 0, 0], max: [1, 1, 0] }],
  })
}

const TRIANGLE_BUFFER = new Float32Array([0, 0, 0, 1, 0, 0, 0, 1, 0])
const TRIANGLE_DATA_URI = `data:application/octet-stream;base64,${Buffer.from(TRIANGLE_BUFFER.buffer).toString('base64')}`

describe('loadModel', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('opens an OBJ with its material library', async () => {
    const model = await loadModel([new File([CUBE_OBJ], 'cube.obj'), new File([CUBE_MTL], 'cube.mtl')])
    expect(model.format).toBe('obj')
    expect(model.missing).toEqual([])
    expect(model.stats).toMatchObject({ meshes: 1, triangles: 12, size: { x: 1, y: 1, z: 1 } })
    const mesh = model.object.children[0] as Mesh
    expect((mesh.material as MeshPhongMaterial).color.getHex()).toBe(0xff0000)
  })

  it('opens an OBJ without its material library and reports it as missing', async () => {
    const model = await loadModel([new File([CUBE_OBJ], 'cube.obj')])
    expect(model.stats.triangles).toBe(12)
    expect(model.missing).toEqual(['cube.mtl'])
    const material = (model.object.children[0] as Mesh).material as MeshStandardMaterial
    expect(material.isMeshStandardMaterial).toBe(true)
  })

  it('opens a glTF with an embedded buffer', async () => {
    const model = await loadModel([new File([triangleGltf(TRIANGLE_DATA_URI)], 'triangle.gltf')])
    expect(model.format).toBe('gltf')
    expect(model.stats).toMatchObject({ meshes: 1, vertices: 3, triangles: 1 })
  })

  it('opens a glTF with its buffer dropped next to it', async () => {
    // jsdom cannot create or fetch blob: URLs, so serve the dropped buffer as a data URI.
    const createObjectURL = vi.fn(() => TRIANGLE_DATA_URI)
    const revokeObjectURL = vi.fn()
    vi.stubGlobal('URL', Object.assign(class extends URL {}, { createObjectURL, revokeObjectURL }))
    const model = await loadModel([
      new File([triangleGltf('triangle.bin')], 'triangle.gltf'),
      new File([TRIANGLE_BUFFER], 'triangle.bin'),
    ])
    expect(model.stats.triangles).toBe(1)
    expect(createObjectURL).toHaveBeenCalledWith(expect.objectContaining({ name: 'triangle.bin' }))
    model.revokeUrls()
    expect(revokeObjectURL).toHaveBeenCalledWith(TRIANGLE_DATA_URI)
  })

  it('names the missing buffer when a glTF cannot be opened', async () => {
    await expect(loadModel([new File([triangleGltf('triangle.bin')], 'triangle.gltf')])).rejects.toThrow(
      'Missing file: triangle.bin. Drop it together with the model.',
    )
  })

  it('explains that Draco compression is not supported', async () => {
    const gltf = JSON.parse(triangleGltf(TRIANGLE_DATA_URI))
    gltf.extensionsUsed = gltf.extensionsRequired = ['KHR_draco_mesh_compression']
    await expect(loadModel([new File([JSON.stringify(gltf)], 'draco.gltf')])).rejects.toThrow(/Draco/)
  })

  it('rejects damaged glTF files', async () => {
    await expect(loadModel([new File(['{ not json'], 'broken.gltf')])).rejects.toThrow(/could not be read/)
  })
})
