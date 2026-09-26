import { describe, expect, it } from 'vitest'
import { encodeEmail, encodePhone, encodeSms, encodeVCard, encodeWifi, type VCardContent } from './payloads'

const EMPTY_CARD: VCardContent = {
  firstName: '',
  lastName: '',
  organization: '',
  jobTitle: '',
  phone: '',
  email: '',
  website: '',
  note: '',
}

describe('encodeWifi', () => {
  it('builds a WPA network string', () => {
    expect(encodeWifi({ ssid: 'Home', password: 'secret', security: 'WPA', hidden: false })).toBe('WIFI:T:WPA;S:Home;P:secret;;')
  })

  it('escapes special characters', () => {
    expect(encodeWifi({ ssid: 'My;Net', password: 'a:b,c"d\\', security: 'WPA', hidden: true })).toBe(
      String.raw`WIFI:T:WPA;S:My\;Net;P:a\:b\,c\"d\\;H:true;;`,
    )
  })

  it('omits the password for open networks and requires an SSID', () => {
    expect(encodeWifi({ ssid: 'Cafe', password: 'ignored', security: 'nopass', hidden: false })).toBe('WIFI:T:nopass;S:Cafe;;')
    expect(encodeWifi({ ssid: '', password: 'x', security: 'WPA', hidden: false })).toBe('')
  })
})

describe('encodeVCard', () => {
  it('returns an empty string without identifying fields', () => {
    expect(encodeVCard({ ...EMPTY_CARD, note: 'only a note' })).toBe('')
  })

  it('builds a vCard 3.0 with escaped values and CRLF line endings', () => {
    const vcard = encodeVCard({
      ...EMPTY_CARD,
      firstName: 'Ada',
      lastName: 'Lovelace',
      organization: 'Engines, Ltd; UK',
      phone: '+44 20 1234-5678',
      note: 'line 1\nline 2',
    })
    expect(vcard).toBe(
      [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'N:Lovelace;Ada;;;',
        'FN:Ada Lovelace',
        String.raw`ORG:Engines\, Ltd\; UK`,
        'TEL;TYPE=CELL:+442012345678',
        'NOTE:line 1\\nline 2',
        'END:VCARD',
      ].join('\r\n'),
    )
  })

  it('uses the organization as display name when there is no person name', () => {
    expect(encodeVCard({ ...EMPTY_CARD, organization: 'ACME' })).toContain('FN:ACME')
  })
})

describe('other encoders', () => {
  it('encodes mailto links', () => {
    expect(encodeEmail({ to: 'a@b.co', subject: 'Hi there', body: 'x&y' })).toBe('mailto:a@b.co?subject=Hi%20there&body=x%26y')
    expect(encodeEmail({ to: 'a@b.co', subject: '', body: '' })).toBe('mailto:a@b.co')
    expect(encodeEmail({ to: ' ', subject: 's', body: '' })).toBe('')
  })

  it('encodes SMS and phone numbers', () => {
    expect(encodeSms({ phone: '+34 600 11 22 33', message: 'Hello' })).toBe('SMSTO:+34600112233:Hello')
    expect(encodeSms({ phone: '600', message: '' })).toBe('SMSTO:600')
    expect(encodePhone({ phone: '(555) 010-9999' })).toBe('tel:5550109999')
    expect(encodePhone({ phone: 'abc' })).toBe('')
  })
})
