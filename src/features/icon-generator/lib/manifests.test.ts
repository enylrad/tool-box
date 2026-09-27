import { describe, expect, it } from 'vitest'
import { androidBackgroundColorXml, iosContentsJson, webHeadSnippet, webManifest } from './manifests'
import { IOS_ICONS, WEB_FILES, imageSpecs } from './platforms'

describe('iosContentsJson', () => {
  it('lists every icon slot and only references generated files', () => {
    const contents = JSON.parse(iosContentsJson()) as { images: { filename: string; idiom: string; scale: string; size: string }[] }
    expect(contents.images).toHaveLength(IOS_ICONS.length)
    const generated = new Set(imageSpecs('ios').map((spec) => spec.path.split('/').pop()))
    for (const image of contents.images) expect(generated.has(image.filename)).toBe(true)
    expect(contents.images).toContainEqual({ filename: 'Icon-83.5@2x.png', idiom: 'ipad', scale: '2x', size: '83.5x83.5' })
    expect(contents.images).toContainEqual({ filename: 'Icon-1024@1x.png', idiom: 'ios-marketing', scale: '1x', size: '1024x1024' })
  })
})

describe('webManifest', () => {
  it('describes the app and its icons', () => {
    const manifest = JSON.parse(webManifest({ appName: ' Tool Box ', shortName: '', themeColor: '#112233', backgroundColor: '#ffffff' }))
    expect(manifest).toMatchObject({ name: 'Tool Box', short_name: 'Tool Box', theme_color: '#112233', background_color: '#ffffff' })
    expect(manifest.icons).toContainEqual({ src: WEB_FILES.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' })
  })

  it('falls back to a default name', () => {
    expect(JSON.parse(webManifest({ appName: '', shortName: '', themeColor: '#000000', backgroundColor: '#000000' })).name).toBe('My App')
  })
})

describe('webHeadSnippet', () => {
  it('links the SVG favicon only when there is one', () => {
    expect(webHeadSnippet({ themeColor: '#000000', hasSvg: true })).toContain('favicon.svg')
    expect(webHeadSnippet({ themeColor: '#000000', hasSvg: false })).not.toContain('favicon.svg')
  })

  it('only references files that are generated', () => {
    const generated = new Set([...imageSpecs('web').map((spec) => spec.path.replace('web/', '')), WEB_FILES.manifest, WEB_FILES.faviconSvg])
    const hrefs = [...webHeadSnippet({ themeColor: '#000000', hasSvg: true }).matchAll(/href="\/([^"]+)"/g)].map((match) => match[1])
    expect(hrefs.length).toBeGreaterThan(0)
    for (const href of hrefs) expect(generated.has(href)).toBe(true)
  })
})

describe('androidBackgroundColorXml', () => {
  it('declares the adaptive icon background color', () => {
    expect(androidBackgroundColorXml('#1a2b3c')).toContain('<color name="ic_launcher_background">#1A2B3C</color>')
  })
})
