import { unzipSync } from 'fflate'
import { describe, expect, it, vi } from 'vitest'
import { buildIconBundle, type BundleOptions, type Rasterize } from './bundle'
import { imageSpecs } from './platforms'
import { zipBundle } from './zip'

const OPTIONS: BundleOptions = {
  platforms: ['android', 'ios', 'web', 'windows'],
  appName: 'Demo',
  shortName: '',
  themeColor: '#000000',
  backgroundColor: '#ffffff',
  svgText: null,
}

function fakeRasterizer() {
  return vi.fn<Rasterize>(async (size, variant, noAlpha) => new TextEncoder().encode(`${variant}:${size}${noAlpha ? ':rgb' : ''}`) as Uint8Array<ArrayBuffer>)
}

describe('buildIconBundle', () => {
  it('only generates files for the selected platforms', async () => {
    const files = await buildIconBundle({ ...OPTIONS, platforms: ['ios'] }, fakeRasterizer())
    expect(files.every((file) => file.platform === 'ios')).toBe(true)
    expect(files.map((file) => file.path)).toContain('ios/AppIcon.appiconset/Contents.json')
    expect(files.filter((file) => file.type === 'png')).toHaveLength(imageSpecs('ios').length)
  })

  it('renders each size and variant only once', async () => {
    const rasterize = fakeRasterizer()
    await buildIconBundle(OPTIONS, rasterize)
    const keys = rasterize.mock.calls.map(([size, variant, noAlpha]) => `${variant}:${size}:${noAlpha}`)
    expect(new Set(keys).size).toBe(keys.length)
  })

  it('passes each spec its size and variant', async () => {
    const files = await buildIconBundle(OPTIONS, fakeRasterizer())
    const decode = (path: string) => new TextDecoder().decode(files.find((file) => file.path === path)?.data)
    expect(decode('ios/AppIcon.appiconset/Icon-60@3x.png')).toBe('opaque:180:rgb')
    expect(decode('android/res/mipmap-xxhdpi/ic_launcher_round.png')).toBe('round:144')
    expect(decode('web/maskable-icon-512x512.png')).toBe('maskable:512')
    expect(files.find((file) => file.path === 'windows/app.ico')).toMatchObject({ type: 'ico', size: 256 })
  })

  it('adds the Android resources, web manifest and snippet', async () => {
    const paths = (await buildIconBundle(OPTIONS, fakeRasterizer())).map((file) => file.path)
    expect(paths).toEqual(
      expect.arrayContaining([
        'android/res/mipmap-anydpi-v26/ic_launcher.xml',
        'android/res/mipmap-anydpi-v26/ic_launcher_round.xml',
        'android/res/values/ic_launcher_background.xml',
        'web/site.webmanifest',
        'web/head-snippet.html',
      ]),
    )
    expect(paths).not.toContain('web/favicon.svg')
  })

  it('copies the original SVG as favicon.svg', async () => {
    const files = await buildIconBundle({ ...OPTIONS, platforms: ['web'], svgText: '<svg/>' }, fakeRasterizer())
    const svg = files.find((file) => file.path === 'web/favicon.svg')
    expect(svg?.type).toBe('svg')
    expect(new TextDecoder().decode(svg?.data)).toBe('<svg/>')
  })

  it('stops when aborted', async () => {
    const controller = new AbortController()
    controller.abort()
    await expect(buildIconBundle({ ...OPTIONS, signal: controller.signal }, fakeRasterizer())).rejects.toThrow()
  })
})

describe('zipBundle', () => {
  it('stores every file under its path', async () => {
    const files = await buildIconBundle(OPTIONS, fakeRasterizer())
    const unzipped = unzipSync(zipBundle(files))
    expect(Object.keys(unzipped).sort()).toEqual(files.map((file) => file.path).sort())
    expect(new TextDecoder().decode(unzipped['web/apple-touch-icon.png'])).toBe('opaque:180')
  })
})
