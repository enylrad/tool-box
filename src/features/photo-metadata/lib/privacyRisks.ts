import { readCaptureDates } from './basicInfo'
import { serialNumber } from './cameraInfo'
import type { EditSignals } from './editSignals'
import { formatCoordinates, type GpsLocation } from './gps'
import { tagText, type MetadataTags } from './tags'

export type RiskLevel = 'none' | 'low' | 'medium' | 'high'

export interface PrivacyRisk {
  level: Exclude<RiskLevel, 'none'>
  title: string
  detail?: string
}

const LEVEL_ORDER: RiskLevel[] = ['none', 'low', 'medium', 'high']

function joinPresent(values: (string | undefined)[]) {
  const unique = [...new Set(values.filter((value): value is string => Boolean(value)))]
  return unique.length ? unique.join(' · ') : undefined
}

/** What someone who receives this file could learn about the person who took it. */
export function readPrivacyRisks(tags: MetadataTags, location: GpsLocation | null, edits: EditSignals, device: string | undefined) {
  const risks: PrivacyRisk[] = []
  const add = (level: PrivacyRisk['level'], title: string, detail: string | undefined, when = Boolean(detail)) => {
    if (when) risks.push({ level, title, detail })
  }

  add('high', 'Exact location where the photo was taken', location ? formatCoordinates(location) : undefined)
  add(
    'medium',
    'Place names',
    joinPresent([
      tagText(tags, ['Sub-location', 'City', 'Province/State', 'Country/Primary Location Name'], ['iptc']),
      tagText(tags, ['Location', 'City', 'State', 'Country'], ['xmp']),
    ]),
  )
  add(
    'medium',
    'Names of people (author, owner, copyright)',
    joinPresent([
      tagText(tags, ['Artist', 'XPAuthor', 'CameraOwnerName', 'OwnerName'], ['exif', 'makerNotes']),
      tagText(tags, 'Copyright', ['exif']),
      tagText(tags, ['creator', 'Creator', 'rights', 'Rights', 'Owner'], ['xmp']),
      tagText(tags, ['By-line', 'Copyright Notice', 'Contact'], ['iptc']),
    ]),
  )
  add(
    'medium',
    'People tagged in the photo',
    tagText(tags, ['PersonInImage', 'RegionInfo', 'Regions'], ['xmp']) ? 'Face or person regions are stored in XMP' : undefined,
  )
  add(
    'medium',
    'Device serial numbers (link all photos from the same camera)',
    joinPresent([serialNumber(tags), tagText(tags, 'LensSerialNumber', ['exif', 'xmp']), tagText(tags, 'ImageUniqueID', ['exif'])]),
  )
  add('medium', 'Text prompt used to generate the image', edits.prompt ? `${edits.prompt.text.slice(0, 80)}…` : undefined)
  add(
    'low',
    'Comments, captions or keywords',
    joinPresent([
      tagText(tags, ['ImageDescription', 'UserComment', 'XPComment', 'XPSubject', 'XPKeywords', 'XPTitle'], ['exif']),
      tagText(tags, ['description', 'Description', 'title', 'subject'], ['xmp']),
      tagText(tags, ['Caption/Abstract', 'Keywords', 'Headline', 'Object Name'], ['iptc']),
    ])?.slice(0, 160),
  )
  add('low', 'Exact date and time', readCaptureDates(tags).captured)
  add('low', 'Phone or camera model', device)
  add('low', 'Editing software', edits.software.length ? edits.software.join(', ') : undefined)
  add(
    'low',
    'Embedded preview thumbnail',
    tags.Thumbnail?.image ? 'May still show the original, uncropped or unedited picture' : undefined,
  )

  const level = risks.reduce<RiskLevel>(
    (highest, risk) => (LEVEL_ORDER.indexOf(risk.level) > LEVEL_ORDER.indexOf(highest) ? risk.level : highest),
    'none',
  )
  return { level, risks }
}
