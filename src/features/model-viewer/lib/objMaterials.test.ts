import { describe, expect, it } from 'vitest'
import { findMaterialLibraries } from './objMaterials'

describe('findMaterialLibraries', () => {
  it('lists every mtllib file once', () => {
    const obj = ['# comment', 'mtllib house.mtl', 'v 0 0 0', '  mtllib roof.mtl house.mtl  ', 'usemtl brick'].join('\n')
    expect(findMaterialLibraries(obj)).toEqual(['house.mtl', 'roof.mtl'])
  })

  it('handles Windows line endings and files without libraries', () => {
    expect(findMaterialLibraries('mtllib a.mtl\r\nv 0 0 0\r\n')).toEqual(['a.mtl'])
    expect(findMaterialLibraries('v 0 0 0')).toEqual([])
  })
})
