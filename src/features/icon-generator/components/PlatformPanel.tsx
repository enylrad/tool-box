import { Toggle } from '../../../components/form/Toggle'
import { PLATFORMS, PLATFORM_LABELS, type Platform } from '../lib/platforms'

const PLATFORM_HINTS: Record<Platform, string> = {
  android: 'Launcher icons for every density, adaptive and themed icons, Play Store icon',
  ios: 'Xcode AppIcon.appiconset for iPhone, iPad and the App Store',
  web: 'favicon.ico, PNG favicons, Apple touch icon, PWA icons and manifest',
  windows: 'Multi-resolution app.ico (16–256 px) plus separate PNGs',
}

interface PlatformPanelProps {
  platforms: Record<Platform, boolean>
  onChange: (platform: Platform, enabled: boolean) => void
}

export function PlatformPanel({ platforms, onChange }: PlatformPanelProps) {
  return (
    <ul className="space-y-3">
      {PLATFORMS.map((platform) => (
        <li key={platform}>
          <Toggle label={PLATFORM_LABELS[platform]} checked={platforms[platform]} onChange={(enabled) => onChange(platform, enabled)} />
          <p className="ml-6 text-xs text-slate-500 dark:text-slate-400">{PLATFORM_HINTS[platform]}</p>
        </li>
      ))}
    </ul>
  )
}
