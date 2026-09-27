import { describe, expect, it } from 'vitest'
import { classifyFiles, extensionOf } from './classifyFiles'

const file = (name: string) => new File([''], name)

describe('extensionOf', () => {
  it('returns the lower-case extension', () => {
    expect(extensionOf('Model.GLB')).toBe('glb')
    expect(extensionOf('archive.tar.gz')).toBe('gz')
  })

  it('returns an empty string without an extension', () => {
    expect(extensionOf('README')).toBe('')
    expect(extensionOf('.hidden')).toBe('')
  })
})

describe('classifyFiles', () => {
  it('keeps every other file as a resource of the model', () => {
    const obj = file('chair.obj')
    const mtl = file('chair.mtl')
    const texture = file('wood.png')
    expect(classifyFiles([mtl, obj, texture])).toEqual({ main: obj, format: 'obj', resources: [mtl, texture] })
  })

  it('prefers GLB over glTF over OBJ', () => {
    const obj = file('a.obj')
    const gltf = file('a.gltf')
    const glb = file('a.glb')
    expect(classifyFiles([obj, gltf, glb]).main).toBe(glb)
    expect(classifyFiles([obj, gltf]).main).toBe(gltf)
  })

  it('names formats that are not supported', () => {
    expect(() => classifyFiles([file('car.FBX')])).toThrow(/FBX files are not supported/)
  })

  it('rejects files that are not 3D models', () => {
    expect(() => classifyFiles([file('notes.txt')])).toThrow(/No 3D model found/)
    expect(() => classifyFiles([])).toThrow(/No 3D model found/)
  })
})
