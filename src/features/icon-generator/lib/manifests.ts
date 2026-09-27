import { IOS_ICONS, WEB_FILES, iosFileName } from './platforms'

function escapeXml(value: string): string {
  return value.replace(/[<>&'"]/g, (char) => `&#${char.charCodeAt(0)};`)
}

/** `Contents.json` of the Xcode `AppIcon.appiconset` folder. */
export function iosContentsJson(): string {
  const images = IOS_ICONS.map((icon) => ({
    filename: iosFileName(icon),
    idiom: icon.idiom,
    scale: `${icon.scale}x`,
    size: `${icon.points}x${icon.points}`,
  }))
  return `${JSON.stringify({ images, info: { author: 'xcode', version: 1 } }, null, 2)}\n`
}

/** `mipmap-anydpi-v26/ic_launcher.xml` (and `ic_launcher_round.xml`, which is identical). */
export function androidAdaptiveIconXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@color/ic_launcher_background" />
    <foreground android:drawable="@mipmap/ic_launcher_foreground" />
    <monochrome android:drawable="@mipmap/ic_launcher_monochrome" />
</adaptive-icon>
`
}

/** `values/ic_launcher_background.xml`: the adaptive icon background layer. */
export function androidBackgroundColorXml(backgroundColor: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="ic_launcher_background">${escapeXml(backgroundColor.toUpperCase())}</color>
</resources>
`
}

export interface WebManifestOptions {
  appName: string
  shortName: string
  themeColor: string
  backgroundColor: string
}

/** `site.webmanifest` for installable web apps (PWA). */
export function webManifest({ appName, shortName, themeColor, backgroundColor }: WebManifestOptions): string {
  const name = appName.trim() || 'My App'
  const manifest = {
    name,
    short_name: shortName.trim() || name,
    icons: [
      { src: WEB_FILES.chrome192, sizes: '192x192', type: 'image/png' },
      { src: WEB_FILES.chrome512, sizes: '512x512', type: 'image/png' },
      { src: WEB_FILES.maskable512, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
    theme_color: themeColor,
    background_color: backgroundColor,
    display: 'standalone',
    start_url: '/',
  }
  return `${JSON.stringify(manifest, null, 2)}\n`
}

/** The tags to paste inside `<head>`, assuming the web files are served from the site root. */
export function webHeadSnippet({ themeColor, hasSvg }: { themeColor: string; hasSvg: boolean }): string {
  const lines = [
    `<link rel="icon" href="/${WEB_FILES.faviconIco}" sizes="48x48">`,
    ...(hasSvg ? [`<link rel="icon" href="/${WEB_FILES.faviconSvg}" type="image/svg+xml">`] : []),
    `<link rel="icon" href="/${WEB_FILES.favicon32}" type="image/png" sizes="32x32">`,
    `<link rel="icon" href="/${WEB_FILES.favicon16}" type="image/png" sizes="16x16">`,
    `<link rel="apple-touch-icon" href="/${WEB_FILES.appleTouch}">`,
    `<link rel="manifest" href="/${WEB_FILES.manifest}">`,
    `<meta name="theme-color" content="${escapeXml(themeColor)}">`,
  ]
  return `${lines.join('\n')}\n`
}
