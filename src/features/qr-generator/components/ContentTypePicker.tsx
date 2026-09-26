import { SegmentedControl } from '../../../components/form/SegmentedControl'
import type { SelectOption } from '../../../components/form/Select'
import type { ContentType } from '../lib/payloads'

const CONTENT_TYPES: SelectOption<ContentType>[] = [
  { value: 'text', label: 'Text / URL' },
  { value: 'wifi', label: 'Wi-Fi' },
  { value: 'vcard', label: 'Contact' },
  { value: 'email', label: 'Email' },
  { value: 'sms', label: 'SMS' },
  { value: 'phone', label: 'Phone' },
]

interface ContentTypePickerProps {
  value: ContentType
  onChange: (type: ContentType) => void
}

export function ContentTypePicker({ value, onChange }: ContentTypePickerProps) {
  return <SegmentedControl label="Type" value={value} options={CONTENT_TYPES} onChange={onChange} />
}
