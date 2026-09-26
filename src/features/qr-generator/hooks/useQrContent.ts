import { useCallback, useMemo, useState } from 'react'
import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { encodePayload, type ContentType, type QrContent, type WifiContent } from '../lib/payloads'

const STORAGE_KEY = 'tool-box:qr-generator:content'

type SectionKey = Exclude<keyof QrContent, 'type' | 'text'>

/** What is saved to localStorage: everything except the Wi-Fi password. */
type PersistedContent = Omit<QrContent, 'wifi'> & { wifi: Omit<WifiContent, 'password'> }

const DEFAULT_CONTENT: PersistedContent = {
  type: 'text',
  text: 'https://enylrad.github.io/tool-box/',
  wifi: { ssid: '', security: 'WPA', hidden: false },
  vcard: { firstName: '', lastName: '', organization: '', jobTitle: '', phone: '', email: '', website: '', note: '' },
  email: { to: '', subject: '', body: '' },
  sms: { phone: '', message: '' },
  phone: { phone: '' },
}

/** QR content form state and the encoded payload. */
export function useQrContent() {
  const [stored, setStored] = useLocalStorage<PersistedContent>(STORAGE_KEY, DEFAULT_CONTENT)
  // Kept in memory only, so secrets never end up in browser storage.
  const [wifiPassword, setWifiPassword] = useState('')

  const content = useMemo<QrContent>(
    () => ({
      type: stored.type ?? DEFAULT_CONTENT.type,
      text: stored.text ?? DEFAULT_CONTENT.text,
      wifi: { ...DEFAULT_CONTENT.wifi, ...stored.wifi, password: wifiPassword },
      vcard: { ...DEFAULT_CONTENT.vcard, ...stored.vcard },
      email: { ...DEFAULT_CONTENT.email, ...stored.email },
      sms: { ...DEFAULT_CONTENT.sms, ...stored.sms },
      phone: { ...DEFAULT_CONTENT.phone, ...stored.phone },
    }),
    [stored, wifiPassword],
  )

  const setType = useCallback((type: ContentType) => setStored((previous) => ({ ...previous, type })), [setStored])

  const setText = useCallback((text: string) => setStored((previous) => ({ ...previous, text })), [setStored])

  const updateSection = useCallback(
    <K extends SectionKey>(section: K, patch: Partial<QrContent[K]>) => {
      const { password, ...persistablePatch } = patch as Partial<WifiContent>
      if (section === 'wifi' && password !== undefined) setWifiPassword(password)
      setStored((previous) => ({ ...previous, [section]: { ...previous[section], ...persistablePatch } }))
    },
    [setStored],
  )

  const payload = useMemo(() => encodePayload(content), [content])

  return { content, payload, setType, setText, updateSection }
}
