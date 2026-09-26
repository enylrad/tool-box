import { Select, type SelectOption } from '../../../components/form/Select'
import { TextArea, TextInput } from '../../../components/form/TextInput'
import { Toggle } from '../../../components/form/Toggle'
import type { QrContent, WifiSecurity } from '../lib/payloads'

type SectionKey = Exclude<keyof QrContent, 'type' | 'text'>

interface ContentFormProps {
  content: QrContent
  onTextChange: (text: string) => void
  onSectionChange: <K extends SectionKey>(section: K, patch: Partial<QrContent[K]>) => void
}

const WIFI_SECURITY_OPTIONS: SelectOption<WifiSecurity>[] = [
  { value: 'WPA', label: 'WPA / WPA2 / WPA3' },
  { value: 'WEP', label: 'WEP' },
  { value: 'nopass', label: 'None (open network)' },
]

/** The form fields for the selected content type. */
export function ContentForm({ content, onTextChange, onSectionChange }: ContentFormProps) {
  switch (content.type) {
    case 'text':
      return (
        <TextArea
          label="Text or URL"
          value={content.text}
          onChange={onTextChange}
          placeholder="https://example.com"
          rows={4}
        />
      )

    case 'wifi': {
      const { wifi } = content
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="Network name (SSID)" value={wifi.ssid} onChange={(ssid) => onSectionChange('wifi', { ssid })} />
          <Select
            label="Security"
            value={wifi.security}
            options={WIFI_SECURITY_OPTIONS}
            onChange={(security) => onSectionChange('wifi', { security })}
          />
          {wifi.security !== 'nopass' && (
            <TextInput
              label="Password"
              type="password"
              autoComplete="off"
              hint="Not saved in the browser; you will need to type it again after reloading."
              value={wifi.password}
              onChange={(password) => onSectionChange('wifi', { password })}
            />
          )}
          <div className="flex items-end pb-1">
            <Toggle label="Hidden network" checked={wifi.hidden} onChange={(hidden) => onSectionChange('wifi', { hidden })} />
          </div>
        </div>
      )
    }

    case 'vcard': {
      const { vcard } = content
      const update = (patch: Partial<QrContent['vcard']>) => onSectionChange('vcard', patch)
      return (
        <div className="grid gap-4 sm:grid-cols-2">
          <TextInput label="First name" value={vcard.firstName} onChange={(firstName) => update({ firstName })} />
          <TextInput label="Last name" value={vcard.lastName} onChange={(lastName) => update({ lastName })} />
          <TextInput label="Phone" type="tel" value={vcard.phone} onChange={(phone) => update({ phone })} />
          <TextInput label="Email" type="email" value={vcard.email} onChange={(email) => update({ email })} />
          <TextInput label="Company" value={vcard.organization} onChange={(organization) => update({ organization })} />
          <TextInput label="Job title" value={vcard.jobTitle} onChange={(jobTitle) => update({ jobTitle })} />
          <div className="sm:col-span-2">
            <TextInput label="Website" type="url" value={vcard.website} onChange={(website) => update({ website })} placeholder="https://" />
          </div>
          <div className="sm:col-span-2">
            <TextArea label="Note" value={vcard.note} onChange={(note) => update({ note })} rows={2} />
          </div>
        </div>
      )
    }

    case 'email': {
      const { email } = content
      return (
        <div className="space-y-4">
          <TextInput label="To" type="email" value={email.to} onChange={(to) => onSectionChange('email', { to })} placeholder="name@example.com" />
          <TextInput label="Subject" value={email.subject} onChange={(subject) => onSectionChange('email', { subject })} />
          <TextArea label="Message" value={email.body} onChange={(body) => onSectionChange('email', { body })} rows={3} />
        </div>
      )
    }

    case 'sms':
      return (
        <div className="space-y-4">
          <TextInput label="Phone number" type="tel" value={content.sms.phone} onChange={(phone) => onSectionChange('sms', { phone })} placeholder="+34 600 000 000" />
          <TextArea label="Message" value={content.sms.message} onChange={(message) => onSectionChange('sms', { message })} rows={3} />
        </div>
      )

    case 'phone':
      return (
        <TextInput
          label="Phone number"
          type="tel"
          value={content.phone.phone}
          onChange={(phone) => onSectionChange('phone', { phone })}
          placeholder="+34 600 000 000"
          hint="Scanning the code offers to call this number."
        />
      )
  }
}
