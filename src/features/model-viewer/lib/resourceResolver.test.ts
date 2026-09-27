import { describe, expect, it } from 'vitest'
import { MISSING_RESOURCE_URL, normalizeResourcePath, ResourceResolver } from './resourceResolver'

const file = (name: string) => new File([''], name)

function createResolver(files: File[]) {
  const revoked: string[] = []
  let next = 0
  const resolver = new ResourceResolver(
    files,
    (item) => `blob:test/${next++}-${item.name}`,
    (url) => revoked.push(url),
  )
  return { resolver, revoked }
}

describe('normalizeResourcePath', () => {
  it('keeps only the lower-case file name', () => {
    expect(normalizeResourcePath('./textures/Wood.PNG')).toBe('wood.png')
    expect(normalizeResourcePath('C:\\models\\maps\\bump.jpg')).toBe('bump.jpg')
  })

  it('decodes percent-encoding and drops query strings and fragments', () => {
    expect(normalizeResourcePath('my%20texture.png?v=2#x')).toBe('my texture.png')
    expect(normalizeResourcePath('bad%E0.png')).toBe('bad%e0.png')
  })
})

describe('ResourceResolver', () => {
  it('maps a referenced file to one object URL of the dropped file', () => {
    const { resolver } = createResolver([file('Scene.bin')])
    const url = resolver.resolve('./scene.bin')
    expect(url).toBe('blob:test/0-Scene.bin')
    expect(resolver.resolve('scene.bin')).toBe(url)
    expect(resolver.missing).toEqual([])
  })

  it('leaves data, blob and web URLs untouched', () => {
    const { resolver } = createResolver([])
    for (const url of ['data:application/octet-stream;base64,AAAA', 'blob:x/1', 'https://example.com/a.png']) {
      expect(resolver.resolve(url)).toBe(url)
    }
    expect(resolver.missing).toEqual([])
  })

  it('records files that were not dropped', () => {
    const { resolver } = createResolver([])
    expect(resolver.resolve('textures/diffuse.png')).toBe(MISSING_RESOURCE_URL)
    resolver.resolve('textures/diffuse.png')
    resolver.markMissing('model.mtl')
    expect(resolver.missing).toEqual(['diffuse.png', 'model.mtl'])
  })

  it('finds dropped files by name and revokes every URL it created', () => {
    const texture = file('a.png')
    const { resolver, revoked } = createResolver([texture, file('b.png')])
    expect(resolver.findFile('maps/A.png')).toBe(texture)
    resolver.resolve('a.png')
    resolver.resolve('b.png')
    resolver.revokeAll()
    expect(revoked).toEqual(['blob:test/0-a.png', 'blob:test/1-b.png'])
  })
})
