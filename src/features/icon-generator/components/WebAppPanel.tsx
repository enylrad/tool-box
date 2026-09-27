import { ColorInput } from '../../../components/form/ColorInput'
import { TextInput } from '../../../components/form/TextInput'
import type { IconSettings } from '../hooks/useIconSettings'

interface WebAppPanelProps {
  settings: IconSettings
  onChange: (patch: Partial<IconSettings>) => void
}

export function WebAppPanel({ settings, onChange }: WebAppPanelProps) {
  return (
    <>
      <TextInput label="App name" value={settings.appName} maxLength={60} onChange={(appName) => onChange({ appName })} />
      <TextInput
        label="Short name"
        value={settings.shortName}
        maxLength={30}
        placeholder={settings.appName}
        hint="Shown under the icon on home screens. Defaults to the app name."
        onChange={(shortName) => onChange({ shortName })}
      />
      <ColorInput label="Theme color" value={settings.themeColor} onChange={(themeColor) => onChange({ themeColor })} />
    </>
  )
}
