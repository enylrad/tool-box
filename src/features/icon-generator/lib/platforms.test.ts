import { describe, expect, it } from 'vitest'
import { IOS_ICONS, PLATFORMS, WINDOWS_ICO_SIZES, imageSpecs, iosPixelSize, type PngSpec } from './platforms'

const pngSizes = (platform: Parameters<typeof imageSpecs>[0]) =>
  new Map(imageSpecs(platform).filter((spec): spec is PngSpec => spec.kind === 'png').map((spec) => [spec.path, spec.size]))

describe('imageSpecs', () => {
  it('never produces two files with the same path', () => {
    const paths = PLATFORMS.flatMap((platform) => imageSpecs(platform).map((spec) => spec.path))
    expect(new Set(paths).size).toBe(paths.length)
  })

  it('puts every file in its platform folder', () => {
    for (const platform of PLATFORMS) {
      for (const spec of imageSpecs(platform)) expect(spec.path.startsWith(`${platform}/`)).toBe(true)
    }
  })

  it('generates Android launcher and adaptive icons for every density', () => {
    const sizes = pngSizes('android')
    expect(sizes.get('android/res/mipmap-mdpi/ic_launcher.png')).toBe(48)
    expect(sizes.get('android/res/mipmap-hdpi/ic_launcher_round.png')).toBe(72)
    expect(sizes.get('android/res/mipmap-xxxhdpi/ic_launcher.png')).toBe(192)
    expect(sizes.get('android/res/mipmap-mdpi/ic_launcher_foreground.png')).toBe(108)
    expect(sizes.get('android/res/mipmap-xxxhdpi/ic_launcher_monochrome.png')).toBe(432)
    expect(sizes.get('android/play-store-icon.png')).toBe(512)
  })

  it('generates one opaque file for every iOS slot', () => {
    const specs = imageSpecs('ios')
    expect(specs.every((spec) => spec.variant === 'opaque' && spec.kind === 'png' && spec.noAlpha)).toBe(true)
    const sizes = new Set(specs.map((spec) => (spec.kind === 'png' ? spec.size : 0)))
    for (const icon of IOS_ICONS) expect(sizes.has(iosPixelSize(icon))).toBe(true)
    expect(pngSizes('ios').get('ios/AppIcon.appiconset/Icon-83.5@2x.png')).toBe(167)
    expect(pngSizes('ios').get('ios/AppIcon.appiconset/Icon-1024@1x.png')).toBe(1024)
  })

  it('generates favicons, PWA icons and Windows icons', () => {
    const web = pngSizes('web')
    expect(web.get('web/favicon-16x16.png')).toBe(16)
    expect(web.get('web/apple-touch-icon.png')).toBe(180)
    expect(web.get('web/maskable-icon-512x512.png')).toBe(512)
    expect(imageSpecs('web').find((spec) => spec.path === 'web/favicon.ico')).toMatchObject({ kind: 'ico', sizes: [16, 32, 48] })

    const windowsIco = imageSpecs('windows').find((spec) => spec.kind === 'ico')
    expect(windowsIco).toMatchObject({ path: 'windows/app.ico', sizes: WINDOWS_ICO_SIZES })
    expect(pngSizes('windows').get('windows/png/icon-256x256.png')).toBe(256)
  })
})
