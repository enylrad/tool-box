import type { BundleStatus } from '../hooks/useIconBundle'
import type { IconSettings } from '../hooks/useIconSettings'
import { fileNameOf, type BundleFile } from '../lib/bundle'
import { ANDROID_RES_DIR, IOS_ICONSET_DIR, PLATFORMS, PLATFORM_LABELS, WEB_DIR, WEB_FILES, type Platform } from '../lib/platforms'
import { IconTile } from './IconTile'
import { MaskPreview } from './MaskPreview'

/** Android shows the middle 72 dp of the 108 dp adaptive layers. */
const ADAPTIVE_ZOOM = 108 / 72

interface PreviewPanelProps {
  status: BundleStatus
  files: readonly BundleFile[]
  previews: Map<string, string>
  error: string | null
  settings: IconSettings
  onDownloadFile: (file: BundleFile) => void
}

function MaskPreviews({ platform, previews, settings }: { platform: Platform; previews: Map<string, string>; settings: IconSettings }) {
  const android = previews.get(`${ANDROID_RES_DIR}/mipmap-xxxhdpi/ic_launcher_foreground.png`)
  const monochrome = previews.get(`${ANDROID_RES_DIR}/mipmap-xxxhdpi/ic_launcher_monochrome.png`)
  const ios = previews.get(`${IOS_ICONSET_DIR}/Icon-60@3x.png`)
  const maskable = previews.get(`${WEB_DIR}/${WEB_FILES.maskable512}`)
  const apple = previews.get(`${WEB_DIR}/${WEB_FILES.appleTouch}`)

  const items =
    platform === 'android' && android
      ? [
          <MaskPreview key="circle" src={android} label="Adaptive, circle" mask="circle" background={settings.backgroundColor} zoom={ADAPTIVE_ZOOM} />,
          <MaskPreview key="squircle" src={android} label="Adaptive, squircle" mask="squircle" background={settings.backgroundColor} zoom={ADAPTIVE_ZOOM} />,
          ...(monochrome
            ? [<MaskPreview key="themed" src={monochrome} label="Themed (Android 13+)" mask="circle" background="#1e3a5f" zoom={ADAPTIVE_ZOOM} />]
            : []),
        ]
      : platform === 'ios' && ios
        ? [<MaskPreview key="ios" src={ios} label="Home screen" mask="ios" />]
        : platform === 'web'
          ? [
              ...(maskable ? [<MaskPreview key="maskable" src={maskable} label="Maskable (circle)" mask="circle" />] : []),
              ...(apple ? [<MaskPreview key="apple" src={apple} label="Apple touch" mask="ios" />] : []),
            ]
          : []

  if (items.length === 0) return null
  return <div className="flex flex-wrap gap-4 rounded-lg bg-slate-100 p-3 dark:bg-slate-800">{items}</div>
}

export function PreviewPanel({ status, files, previews, error, settings, onDownloadFile }: PreviewPanelProps) {
  if (status === 'empty') {
    return (
      <p className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500 dark:border-slate-700 dark:text-slate-400">
        Choose an image to preview every icon here.
      </p>
    )
  }
  if (status === 'error') {
    return (
      <p role="alert" className="text-sm text-red-600 dark:text-red-400">
        {error}
      </p>
    )
  }
  if (files.length === 0) {
    return <p className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Generating icons…</p>
  }

  const platforms = PLATFORMS.filter((platform) => files.some((file) => file.platform === platform))
  if (platforms.length === 0) {
    return <p className="p-10 text-center text-sm text-slate-500 dark:text-slate-400">Select at least one platform.</p>
  }

  return (
    <div className={`space-y-8 transition-opacity ${status === 'rendering' ? 'opacity-60' : ''}`} aria-busy={status === 'rendering'}>
      {platforms.map((platform) => {
        const platformFiles = files.filter((file) => file.platform === platform)
        const images = platformFiles.filter((file) => file.type === 'png' || file.type === 'ico')
        const others = platformFiles.filter((file) => file.type === 'svg' || file.type === 'text')
        return (
          <section key={platform} className="space-y-3">
            <h3 className="font-semibold text-slate-900 dark:text-slate-100">
              {PLATFORM_LABELS[platform]} <span className="text-sm font-normal text-slate-500">· {platformFiles.length} files</span>
            </h3>
            <MaskPreviews platform={platform} previews={previews} settings={settings} />
            <ul className="grid grid-cols-[repeat(auto-fill,minmax(8rem,1fr))] gap-2">
              {images.map((file) => (
                <li key={file.path}>
                  <IconTile file={file} previewUrl={previews.get(file.path)} onDownload={onDownloadFile} />
                </li>
              ))}
            </ul>
            {others.length > 0 && (
              <p className="flex flex-wrap items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                Also included:
                {others.map((file) => (
                  <button
                    key={file.path}
                    type="button"
                    title={`Download ${file.path}`}
                    onClick={() => onDownloadFile(file)}
                    className="rounded bg-slate-100 px-2 py-0.5 font-mono text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
                  >
                    {file.path.split('/').slice(1).join('/') || fileNameOf(file.path)}
                  </button>
                ))}
              </p>
            )}
          </section>
        )
      })}
    </div>
  )
}
