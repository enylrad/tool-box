import { formatAperture, formatExposureBias, formatFocalLength, formatShutterSpeed } from './formatValues'
import type { InfoRow } from './infoRows'
import { getTag, tagNumber, tagText, type MetadataTags } from './tags'

/** "Google Pixel 10 Pro" without repeating the brand ("Canon Canon EOS R5" → "Canon EOS R5"). */
export function deviceName(make: string | undefined, model: string | undefined) {
  if (!model) return make
  if (!make) return model
  const brand = make.split(/\s+/)[0].toLowerCase()
  return model.toLowerCase().startsWith(brand) ? model : `${make} ${model}`
}

/** Flash tag bit 0 tells whether the flash fired; the rest describe the mode. */
function describeFlash(tags: MetadataTags) {
  const flash = getTag(tags, 'Flash', ['exif'])
  if (typeof flash?.value === 'number') {
    const fired = (flash.value & 1) === 1
    const details = typeof flash.description === 'string' ? flash.description : ''
    return { fired, text: details || (fired ? 'Fired' : 'Did not fire') }
  }
  const xmpFired = tagText(tags, 'Fired', ['xmp'])
  if (xmpFired) return { fired: xmpFired.toLowerCase() === 'true', text: xmpFired.toLowerCase() === 'true' ? 'Fired' : 'Did not fire' }
  return undefined
}

function lensName(tags: MetadataTags) {
  const model = tagText(tags, ['LensModel', 'Lens', 'LensInfo'], ['exif', 'xmp', 'makerNotes'])
  const make = tagText(tags, 'LensMake', ['exif', 'xmp'])
  return deviceName(make, model)
}

export interface CameraSummary {
  device?: string
  rows: InfoRow[]
  flashFired?: boolean
}

export function readCameraInfo(tags: MetadataTags): CameraSummary {
  const device = deviceName(tagText(tags, 'Make', ['exif', 'xmp']), tagText(tags, 'Model', ['exif', 'xmp']))
  const apex = tagNumber(tags, 'ApertureValue', ['exif', 'xmp'])
  // ApertureValue is stored in APEX units: f-number = 2^(value / 2).
  const aperture = tagNumber(tags, 'FNumber', ['exif', 'xmp']) ?? (apex !== undefined ? 2 ** (apex / 2) : undefined)
  const exposure = tagNumber(tags, 'ExposureTime', ['exif', 'xmp'])
  const iso = tagNumber(tags, ['ISOSpeedRatings', 'PhotographicSensitivity', 'ISOSpeed', 'ISO'], ['exif', 'xmp'])
  const focal = tagNumber(tags, 'FocalLength', ['exif', 'xmp'])
  const focal35 = tagNumber(tags, 'FocalLengthIn35mmFilm', ['exif', 'xmp']) ?? tags.composite?.FocalLength35efl?.value
  const bias = tagNumber(tags, 'ExposureBiasValue', ['exif', 'xmp'])
  const digitalZoom = tagNumber(tags, 'DigitalZoomRatio', ['exif'])
  const subjectDistance = tagNumber(tags, 'SubjectDistance', ['exif'])
  const flash = describeFlash(tags)

  const rows: InfoRow[] = [
    { label: 'Device', value: device },
    { label: 'Lens', value: lensName(tags) },
    { label: 'Aperture', value: aperture ? formatAperture(aperture) : undefined },
    { label: 'Shutter speed', value: exposure ? formatShutterSpeed(exposure) : undefined },
    { label: 'ISO', value: iso ? String(Math.round(iso)) : undefined },
    {
      label: 'Focal length',
      value: focal ? formatFocalLength(focal) : undefined,
      hint: focal35 && focal && Math.round(focal35) !== Math.round(focal) ? `${Math.round(focal35)} mm equivalent (35 mm)` : undefined,
    },
    { label: 'Flash', value: flash?.text },
    { label: 'Exposure compensation', value: bias !== undefined ? formatExposureBias(bias) : undefined },
    { label: 'Exposure program', value: tagText(tags, 'ExposureProgram', ['exif']) },
    { label: 'Exposure mode', value: tagText(tags, 'ExposureMode', ['exif']) },
    { label: 'Metering mode', value: tagText(tags, 'MeteringMode', ['exif']) },
    { label: 'White balance', value: tagText(tags, 'WhiteBalance', ['exif']) },
    { label: 'Scene type', value: tagText(tags, 'SceneCaptureType', ['exif']) },
    { label: 'Field of view', value: tags.composite?.FieldOfView?.description },
    { label: 'Digital zoom', value: digitalZoom && digitalZoom > 1 ? `${Number(digitalZoom.toFixed(2))}×` : undefined },
    { label: 'Subject distance', value: subjectDistance && subjectDistance > 0 ? `${Number(subjectDistance.toFixed(2))} m` : undefined },
    { label: 'Camera serial number', value: serialNumber(tags), mono: true },
    { label: 'Lens serial number', value: tagText(tags, 'LensSerialNumber', ['exif', 'xmp']), mono: true },
    { label: 'Owner', value: tagText(tags, ['CameraOwnerName', 'OwnerName'], ['exif', 'xmp', 'makerNotes']) },
  ]
  return { device, rows, flashFired: flash?.fired }
}

export function serialNumber(tags: MetadataTags) {
  return tagText(tags, ['BodySerialNumber', 'SerialNumber', 'CameraSerialNumber', 'InternalSerialNumber'], ['exif', 'xmp', 'makerNotes'])
}
