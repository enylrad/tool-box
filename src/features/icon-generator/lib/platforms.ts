export type Platform = 'android' | 'ios' | 'web' | 'windows'

export const PLATFORMS: readonly Platform[] = ['android', 'ios', 'web', 'windows']

export const PLATFORM_LABELS: Record<Platform, string> = {
  android: 'Android',
  ios: 'iOS',
  web: 'Web (favicons & PWA)',
  windows: 'Windows desktop',
}

/**
 * How an icon is laid out. See `layout.ts` for the geometry of each variant.
 * - standard: follows the user's background and shape settings.
 * - round: like standard, but always clipped to a circle (Android `ic_launcher_round`).
 * - opaque: full-bleed square that always has a background (iOS, Apple touch, Play Store).
 * - adaptive-foreground: transparent layer with the artwork inside Android's 66 dp safe zone.
 * - monochrome: adaptive-foreground as a single-color silhouette (Android 13 themed icons).
 * - maskable: opaque, artwork inside the PWA maskable safe zone.
 */
export type IconVariant = 'standard' | 'round' | 'opaque' | 'adaptive-foreground' | 'monochrome' | 'maskable'

export interface PngSpec {
  kind: 'png'
  platform: Platform
  path: string
  size: number
  variant: IconVariant
  /** Write the PNG without an alpha channel (required for App Store icons). */
  noAlpha?: boolean
}

export interface IcoSpec {
  kind: 'ico'
  platform: Platform
  path: string
  sizes: readonly number[]
  variant: IconVariant
}

export type ImageSpec = PngSpec | IcoSpec

export const ANDROID_RES_DIR = 'android/res'
/** Launcher icon size in dp; adaptive layers are 108 dp. */
const ANDROID_LAUNCHER_DP = 48
const ANDROID_ADAPTIVE_DP = 108

export const ANDROID_DENSITIES = [
  { name: 'mdpi', scale: 1 },
  { name: 'hdpi', scale: 1.5 },
  { name: 'xhdpi', scale: 2 },
  { name: 'xxhdpi', scale: 3 },
  { name: 'xxxhdpi', scale: 4 },
] as const

export interface IosIcon {
  idiom: 'iphone' | 'ipad' | 'ios-marketing'
  points: number
  scale: 1 | 2 | 3
}

export const IOS_ICONSET_DIR = 'ios/AppIcon.appiconset'

/** Every slot of a classic (all sizes) Xcode app icon set. */
export const IOS_ICONS: readonly IosIcon[] = [
  { idiom: 'iphone', points: 20, scale: 2 },
  { idiom: 'iphone', points: 20, scale: 3 },
  { idiom: 'iphone', points: 29, scale: 2 },
  { idiom: 'iphone', points: 29, scale: 3 },
  { idiom: 'iphone', points: 40, scale: 2 },
  { idiom: 'iphone', points: 40, scale: 3 },
  { idiom: 'iphone', points: 60, scale: 2 },
  { idiom: 'iphone', points: 60, scale: 3 },
  { idiom: 'ipad', points: 20, scale: 1 },
  { idiom: 'ipad', points: 20, scale: 2 },
  { idiom: 'ipad', points: 29, scale: 1 },
  { idiom: 'ipad', points: 29, scale: 2 },
  { idiom: 'ipad', points: 40, scale: 1 },
  { idiom: 'ipad', points: 40, scale: 2 },
  { idiom: 'ipad', points: 76, scale: 1 },
  { idiom: 'ipad', points: 76, scale: 2 },
  { idiom: 'ipad', points: 83.5, scale: 2 },
  { idiom: 'ios-marketing', points: 1024, scale: 1 },
]

export function iosFileName({ points, scale }: IosIcon): string {
  return `Icon-${points}@${scale}x.png`
}

export function iosPixelSize({ points, scale }: IosIcon): number {
  return points * scale
}

export const WEB_DIR = 'web'
export const WEB_FILES = {
  faviconIco: 'favicon.ico',
  faviconSvg: 'favicon.svg',
  favicon16: 'favicon-16x16.png',
  favicon32: 'favicon-32x32.png',
  appleTouch: 'apple-touch-icon.png',
  chrome192: 'android-chrome-192x192.png',
  chrome512: 'android-chrome-512x512.png',
  maskable512: 'maskable-icon-512x512.png',
  manifest: 'site.webmanifest',
  headSnippet: 'head-snippet.html',
} as const

export const WEB_FAVICON_ICO_SIZES = [16, 32, 48] as const

export const WINDOWS_DIR = 'windows'
/** Sizes Windows Explorer, the taskbar and the Start menu pick from, at every display scale. */
export const WINDOWS_ICO_SIZES = [16, 20, 24, 32, 40, 48, 64, 96, 128, 256] as const

function androidSpecs(): ImageSpec[] {
  const specs: ImageSpec[] = []
  for (const { name, scale } of ANDROID_DENSITIES) {
    const dir = `${ANDROID_RES_DIR}/mipmap-${name}`
    const launcher = ANDROID_LAUNCHER_DP * scale
    const adaptive = ANDROID_ADAPTIVE_DP * scale
    specs.push(
      { kind: 'png', platform: 'android', path: `${dir}/ic_launcher.png`, size: launcher, variant: 'standard' },
      { kind: 'png', platform: 'android', path: `${dir}/ic_launcher_round.png`, size: launcher, variant: 'round' },
      { kind: 'png', platform: 'android', path: `${dir}/ic_launcher_foreground.png`, size: adaptive, variant: 'adaptive-foreground' },
      { kind: 'png', platform: 'android', path: `${dir}/ic_launcher_monochrome.png`, size: adaptive, variant: 'monochrome' },
    )
  }
  specs.push({ kind: 'png', platform: 'android', path: 'android/play-store-icon.png', size: 512, variant: 'opaque' })
  return specs
}

function iosSpecs(): ImageSpec[] {
  const seen = new Set<string>()
  const specs: ImageSpec[] = []
  for (const icon of IOS_ICONS) {
    const fileName = iosFileName(icon)
    // iPhone and iPad slots with the same point size and scale share one file.
    if (seen.has(fileName)) continue
    seen.add(fileName)
    specs.push({ kind: 'png', platform: 'ios', path: `${IOS_ICONSET_DIR}/${fileName}`, size: iosPixelSize(icon), variant: 'opaque', noAlpha: true })
  }
  return specs
}

function webSpecs(): ImageSpec[] {
  const path = (fileName: string) => `${WEB_DIR}/${fileName}`
  return [
    { kind: 'ico', platform: 'web', path: path(WEB_FILES.faviconIco), sizes: WEB_FAVICON_ICO_SIZES, variant: 'standard' },
    { kind: 'png', platform: 'web', path: path(WEB_FILES.favicon16), size: 16, variant: 'standard' },
    { kind: 'png', platform: 'web', path: path(WEB_FILES.favicon32), size: 32, variant: 'standard' },
    { kind: 'png', platform: 'web', path: path(WEB_FILES.appleTouch), size: 180, variant: 'opaque' },
    { kind: 'png', platform: 'web', path: path(WEB_FILES.chrome192), size: 192, variant: 'standard' },
    { kind: 'png', platform: 'web', path: path(WEB_FILES.chrome512), size: 512, variant: 'standard' },
    { kind: 'png', platform: 'web', path: path(WEB_FILES.maskable512), size: 512, variant: 'maskable' },
  ]
}

function windowsSpecs(): ImageSpec[] {
  return [
    { kind: 'ico', platform: 'windows', path: `${WINDOWS_DIR}/app.ico`, sizes: WINDOWS_ICO_SIZES, variant: 'standard' },
    ...WINDOWS_ICO_SIZES.map(
      (size): ImageSpec => ({ kind: 'png', platform: 'windows', path: `${WINDOWS_DIR}/png/icon-${size}x${size}.png`, size, variant: 'standard' }),
    ),
  ]
}

const SPEC_BUILDERS: Record<Platform, () => ImageSpec[]> = {
  android: androidSpecs,
  ios: iosSpecs,
  web: webSpecs,
  windows: windowsSpecs,
}

/** Every raster image generated for a platform. */
export function imageSpecs(platform: Platform): ImageSpec[] {
  return SPEC_BUILDERS[platform]()
}
