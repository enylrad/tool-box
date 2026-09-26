export type ContentType = 'text' | 'wifi' | 'vcard' | 'email' | 'sms' | 'phone'

export type WifiSecurity = 'WPA' | 'WEP' | 'nopass'

export interface WifiContent {
  ssid: string
  password: string
  security: WifiSecurity
  hidden: boolean
}

export interface VCardContent {
  firstName: string
  lastName: string
  organization: string
  jobTitle: string
  phone: string
  email: string
  website: string
  note: string
}

export interface EmailContent {
  to: string
  subject: string
  body: string
}

export interface SmsContent {
  phone: string
  message: string
}

export interface PhoneContent {
  phone: string
}

export interface QrContent {
  type: ContentType
  text: string
  wifi: WifiContent
  vcard: VCardContent
  email: EmailContent
  sms: SmsContent
  phone: PhoneContent
}

// Wi-Fi QR format (de-facto standard from ZXing): these characters must be backslash-escaped.
function escapeWifiValue(value: string): string {
  return value.replace(/([\\;,:"])/g, '\\$1')
}

// vCard 3.0 text values (RFC 2426): escape backslash, comma, semicolon and newlines.
function escapeVCardValue(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/,/g, '\\,')
    .replace(/;/g, String.raw`\;`)
    .replace(/\r?\n/g, '\\n')
}

function normalizePhone(phone: string): string {
  return phone.replace(/[^\d+*#]/g, '')
}

export function encodeWifi({ ssid, password, security, hidden }: WifiContent): string {
  if (!ssid) return ''
  const parts = [`T:${security}`, `S:${escapeWifiValue(ssid)}`]
  if (security !== 'nopass' && password) parts.push(`P:${escapeWifiValue(password)}`)
  if (hidden) parts.push('H:true')
  return `WIFI:${parts.join(';')};;`
}

export function encodeVCard(card: VCardContent): string {
  const firstName = card.firstName.trim()
  const lastName = card.lastName.trim()
  const fullName = [firstName, lastName].filter(Boolean).join(' ')
  const hasContent = [fullName, card.organization, card.phone, card.email, card.website].some((value) => value.trim())
  if (!hasContent) return ''

  const lines = ['BEGIN:VCARD', 'VERSION:3.0', `N:${escapeVCardValue(lastName)};${escapeVCardValue(firstName)};;;`]
  lines.push(`FN:${escapeVCardValue(fullName || card.organization.trim())}`)
  const optionalLines: Array<[string, string]> = [
    ['ORG', card.organization],
    ['TITLE', card.jobTitle],
    ['TEL;TYPE=CELL', normalizePhone(card.phone)],
    ['EMAIL', card.email],
    ['URL', card.website],
    ['NOTE', card.note],
  ]
  for (const [property, value] of optionalLines) {
    if (value.trim()) lines.push(`${property}:${escapeVCardValue(value.trim())}`)
  }
  lines.push('END:VCARD')
  return lines.join('\r\n')
}

export function encodeEmail({ to, subject, body }: EmailContent): string {
  const address = to.trim()
  if (!address) return ''
  const query = [
    subject && `subject=${encodeURIComponent(subject)}`,
    body && `body=${encodeURIComponent(body)}`,
  ].filter(Boolean)
  return `mailto:${address}${query.length ? `?${query.join('&')}` : ''}`
}

export function encodeSms({ phone, message }: SmsContent): string {
  const number = normalizePhone(phone)
  if (!number) return ''
  return message ? `SMSTO:${number}:${message}` : `SMSTO:${number}`
}

export function encodePhone({ phone }: PhoneContent): string {
  const number = normalizePhone(phone)
  return number ? `tel:${number}` : ''
}

/** Builds the string stored in the QR code. Returns '' when required fields are missing. */
export function encodePayload(content: QrContent): string {
  switch (content.type) {
    case 'text':
      return content.text.trim() ? content.text : ''
    case 'wifi':
      return encodeWifi(content.wifi)
    case 'vcard':
      return encodeVCard(content.vcard)
    case 'email':
      return encodeEmail(content.email)
    case 'sms':
      return encodeSms(content.sms)
    case 'phone':
      return encodePhone(content.phone)
  }
}
