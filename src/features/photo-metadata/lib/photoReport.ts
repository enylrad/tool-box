import { readBasicInfo, type Dimensions, type FileFacts } from './basicInfo'
import type { C2paInfo } from './c2pa'
import { readCameraInfo } from './cameraInfo'
import { formatMismatch, type ImageFormat } from './detectFormat'
import { readEditSignals } from './editSignals'
import { readGpsLocation } from './gps'
import { presentRows } from './infoRows'
import { readPrivacyRisks } from './privacyRisks'
import { buildMetadataTree } from './rawTree'
import { tagNumber, type MetadataTags } from './tags'

export interface PhotoReportInput {
  file: FileFacts
  format: ImageFormat | null
  tags: MetadataTags
  c2pa: C2paInfo
  decoded: Dimensions | null
}

/** Everything the page shows, derived from the parsed tags. */
export function buildPhotoReport({ file, format, tags, c2pa, decoded }: PhotoReportInput) {
  const camera = readCameraInfo(tags)
  const location = readGpsLocation(tags)
  const edits = readEditSignals(tags, c2pa)
  return {
    basicRows: presentRows(readBasicInfo(file, format, tags, decoded)),
    cameraRows: presentRows(camera.rows),
    location,
    edits,
    privacy: readPrivacyRisks(tags, location, edits, camera.device),
    tree: buildMetadataTree(tags),
    formatWarning: formatMismatch(format, file.name),
    orientation: tagNumber(tags, 'Orientation', ['exif']),
  }
}

export type PhotoReport = ReturnType<typeof buildPhotoReport>
