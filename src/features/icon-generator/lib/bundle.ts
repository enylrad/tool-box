import { encodeIco } from './ico'
import {
  androidAdaptiveIconXml,
  androidBackgroundColorXml,
  iosContentsJson,
  webHeadSnippet,
  webManifest,
} from './manifests'
import {
  ANDROID_RES_DIR,
  IOS_ICONSET_DIR,
  WEB_DIR,
  WEB_FILES,
  imageSpecs,
  type IconVariant,
  type Platform,
} from './platforms'

/** Renders the source image as a square PNG for one size and variant, optionally without an alpha channel. */
export type Rasterize = (size: number, variant: IconVariant, noAlpha: boolean) => Promise<Uint8Array<ArrayBuffer>>

export interface BundleFile {
  platform: Platform
  path: string
  data: Uint8Array<ArrayBuffer>
  type: 'png' | 'ico' | 'svg' | 'text'
  /** Pixel size of PNG files; the largest size for .ico files. */
  size?: number
  /** Every image size inside an .ico file. */
  icoSizes?: readonly number[]
  variant?: IconVariant
}

export interface BundleOptions {
  platforms: readonly Platform[]
  appName: string
  shortName: string
  themeColor: string
  backgroundColor: string
  /** The original SVG, copied as `favicon.svg` when the source is a vector image. */
  svgText: string | null
  signal?: AbortSignal
}

const encoder = new TextEncoder()

export function fileNameOf(path: string): string {
  return path.slice(path.lastIndexOf('/') + 1)
}

function textFile(platform: Platform, path: string, content: string, type: BundleFile['type'] = 'text'): BundleFile {
  return { platform, path, data: encoder.encode(content) as Uint8Array<ArrayBuffer>, type }
}

function extraFiles(platform: Platform, options: BundleOptions): BundleFile[] {
  switch (platform) {
    case 'android': {
      const adaptiveXml = androidAdaptiveIconXml()
      return [
        textFile(platform, `${ANDROID_RES_DIR}/mipmap-anydpi-v26/ic_launcher.xml`, adaptiveXml),
        textFile(platform, `${ANDROID_RES_DIR}/mipmap-anydpi-v26/ic_launcher_round.xml`, adaptiveXml),
        textFile(platform, `${ANDROID_RES_DIR}/values/ic_launcher_background.xml`, androidBackgroundColorXml(options.backgroundColor)),
      ]
    }
    case 'ios':
      return [textFile(platform, `${IOS_ICONSET_DIR}/Contents.json`, iosContentsJson())]
    case 'web':
      return [
        ...(options.svgText ? [textFile(platform, `${WEB_DIR}/${WEB_FILES.faviconSvg}`, options.svgText, 'svg')] : []),
        textFile(platform, `${WEB_DIR}/${WEB_FILES.manifest}`, webManifest(options)),
        textFile(platform, `${WEB_DIR}/${WEB_FILES.headSnippet}`, webHeadSnippet({ themeColor: options.themeColor, hasSvg: Boolean(options.svgText) })),
      ]
    case 'windows':
      return []
  }
}

/**
 * Generates every file for the selected platforms. Each size and variant is
 * rasterized once, so .ico files reuse the PNGs of the same size.
 */
export async function buildIconBundle(options: BundleOptions, rasterize: Rasterize): Promise<BundleFile[]> {
  const cache = new Map<string, Promise<Uint8Array<ArrayBuffer>>>()
  const render = (size: number, variant: IconVariant, noAlpha = false) => {
    options.signal?.throwIfAborted()
    const key = `${variant}:${size}:${noAlpha}`
    let pending = cache.get(key)
    if (!pending) {
      pending = rasterize(size, variant, noAlpha)
      cache.set(key, pending)
    }
    return pending
  }

  const files: BundleFile[] = []
  for (const platform of options.platforms) {
    for (const spec of imageSpecs(platform)) {
      if (spec.kind === 'png') {
        files.push({ platform, path: spec.path, data: await render(spec.size, spec.variant, spec.noAlpha), type: 'png', size: spec.size, variant: spec.variant })
      } else {
        const entries = []
        for (const size of spec.sizes) entries.push({ size, png: await render(size, spec.variant) })
        files.push({ platform, path: spec.path, data: encodeIco(entries), type: 'ico', size: Math.max(...spec.sizes), icoSizes: spec.sizes, variant: spec.variant })
      }
    }
    files.push(...extraFiles(platform, options))
  }
  options.signal?.throwIfAborted()
  return files
}
