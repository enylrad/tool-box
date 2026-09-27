import { describe, expect, it } from 'vitest'
import { readBasicInfo, readCaptureDates, readDimensions } from './basicInfo'
import { deviceName, readCameraInfo } from './cameraInfo'
import { readEditSignals, aiVerdict } from './editSignals'
import { formatAltitude, formatDirection, googleMapsUrl, parseXmpCoordinate, readGpsLocation, toDms } from './gps'
import { presentRows } from './infoRows'
import { readPrivacyRisks } from './privacyRisks'
import { readTags } from './tags'
import { buildJpeg, buildPng, pngChunk, SAMPLE_EXIF, SAMPLE_XMP, toArrayBuffer } from './testUtils'
import { asciiBytes } from './bytes'

const NO_C2PA = { present: false, hints: [], declaresAi: false }

async function sampleTags() {
  return readTags(toArrayBuffer(buildJpeg({ exif: SAMPLE_EXIF, xmp: SAMPLE_XMP })))
}

function rowValue(rows: { label: string; value?: string }[], label: string) {
  return rows.find((row) => row.label === label)?.value
}

describe('readTags', () => {
  it('returns an empty object for files without metadata', async () => {
    expect(await readTags(toArrayBuffer(buildPng()))).toMatchObject({})
  })
})

describe('camera info', () => {
  it('summarizes the device and exposure', async () => {
    const { device, rows, flashFired } = readCameraInfo(await sampleTags())
    expect(device).toBe('Google Pixel 10 Pro')
    expect(flashFired).toBe(false)
    expect(rowValue(rows, 'Aperture')).toBe('f/1.9')
    expect(rowValue(rows, 'Shutter speed')).toBe('1/250 s')
    expect(rowValue(rows, 'ISO')).toBe('100')
    expect(rowValue(rows, 'Focal length')).toBe('6.9 mm')
    expect(rows.find((row) => row.label === 'Focal length')?.hint).toBe('24 mm equivalent (35 mm)')
    expect(rowValue(rows, 'Exposure compensation')).toBe('-0.7 EV')
    expect(rowValue(rows, 'Flash')).toBe('Flash did not fire, compulsory flash mode')
    expect(rowValue(rows, 'Camera serial number')).toBe('ABC123')
    expect(rowValue(rows, 'Lens')).toContain('back camera')
  })

  it('does not repeat the brand in the device name', () => {
    expect(deviceName('Canon', 'Canon EOS R5')).toBe('Canon EOS R5')
    expect(deviceName('NIKON CORPORATION', 'NIKON Z 6')).toBe('NIKON Z 6')
    expect(deviceName('Apple', 'iPhone 17')).toBe('Apple iPhone 17')
    expect(deviceName(undefined, 'X100V')).toBe('X100V')
  })
})

describe('basic info', () => {
  it('reads dimensions, dates and orientation', async () => {
    const tags = await sampleTags()
    // The JPEG header (3×2 fake scan) wins over EXIF, which can be stale after edits.
    expect(readDimensions(tags, null)).toEqual({ width: 3, height: 2 })
    expect(readCaptureDates(tags)).toMatchObject({
      captured: '2025-07-31 18:32:10 (UTC+02:00)',
      modified: '2025-08-01 10:00:00',
    })
    const rows = presentRows(
      readBasicInfo({ name: 'IMG_1.jpg', size: 2_500_000, type: 'image/jpeg', lastModified: 0 }, null, tags, null),
    )
    expect(rowValue(rows, 'File size')).toBe('2.4 MB')
    expect(rowValue(rows, 'Orientation')).toBe('Rotated 90° clockwise')
    expect(rowValue(rows, 'File date')).toBeUndefined()
  })
})

describe('GPS', () => {
  it('converts EXIF coordinates to signed decimals', async () => {
    const location = readGpsLocation(await sampleTags())!
    expect(location.latitude).toBeCloseTo(40.42008, 4)
    expect(location.longitude).toBeCloseTo(-3.70833, 4)
    expect(location.altitude).toBeCloseTo(657.5)
    expect(googleMapsUrl(location)).toBe('https://www.google.com/maps/search/?api=1&query=40.420083,-3.708333')
    expect(toDms(location.latitude, 'lat')).toBe('40° 25′ 12.3″ N')
    expect(toDms(location.longitude, 'lon')).toBe('3° 42′ 30″ W')
  })

  it('returns null without a position', async () => {
    expect(readGpsLocation(await readTags(toArrayBuffer(buildJpeg({ exif: { ifd0: SAMPLE_EXIF.ifd0 } }))))).toBeNull()
  })

  it('formats XMP coordinates, altitude and direction', () => {
    expect(parseXmpCoordinate('40,25.2N')).toBeCloseTo(40.42)
    expect(parseXmpCoordinate('3,42,30W')).toBeCloseTo(-3.70833, 4)
    expect(parseXmpCoordinate('nonsense')).toBeUndefined()
    expect(formatAltitude(-12.34)).toBe('12.3 m below sea level')
    expect(formatDirection(135)).toBe('135° (SE)')
    expect(formatDirection(359)).toBe('359° (N)')
  })
})

describe('edit and AI signals', () => {
  it('lists software, XMP history and IPTC source type', async () => {
    const signals = readEditSignals(await sampleTags(), NO_C2PA)
    expect(signals.software).toEqual(['HDR+ 1.0', 'Adobe Photoshop 25.0'])
    expect(signals.modifiedAfterCapture).toBe(true)
    expect(signals.history).toEqual([{ action: 'saved', when: '2025-08-01T10:00:00+02:00', software: 'Adobe Photoshop 25.0', changed: '/' }])
    expect(signals.ai.map((signal) => signal.strength)).toEqual(['edited'])
    expect(aiVerdict(signals.ai)).toBe('AI-edited')
  })

  it('finds Stable Diffusion prompts in PNG text chunks', async () => {
    const text = asciiBytes('parameters\0a cat in space\nSteps: 20, Sampler: Euler a, CFG scale: 7, Seed: 1')
    const tags = await readTags(toArrayBuffer(buildPng([pngChunk('tEXt', text)])))
    const signals = readEditSignals(tags, NO_C2PA)
    expect(signals.prompt?.text).toContain('a cat in space')
    expect(aiVerdict(signals.ai)).toBe('Likely AI-generated')
  })

  it('reports nothing for a plain file', async () => {
    const signals = readEditSignals(await readTags(toArrayBuffer(buildPng())), NO_C2PA)
    expect(signals.ai).toEqual([])
    expect(aiVerdict(signals.ai)).toBeNull()
  })
})

describe('privacy risks', () => {
  it('rates a geotagged photo as high risk', async () => {
    const tags = await sampleTags()
    const location = readGpsLocation(tags)
    const { level, risks } = readPrivacyRisks(tags, location, readEditSignals(tags, NO_C2PA), 'Google Pixel 10 Pro')
    expect(level).toBe('high')
    expect(risks.map((risk) => risk.title)).toEqual(
      expect.arrayContaining(['Exact location where the photo was taken', 'Phone or camera model', 'Exact date and time']),
    )
    expect(risks.find((risk) => risk.title.startsWith('Device serial'))?.detail).toBe('ABC123')
  })

  it('reports no risk for a file without metadata', async () => {
    const tags = await readTags(toArrayBuffer(buildPng()))
    expect(readPrivacyRisks(tags, null, readEditSignals(tags, NO_C2PA), undefined)).toEqual({ level: 'none', risks: [] })
  })
})
