import { describe, expect, it } from 'vitest'
import {
  DEFAULT_EXPORT_SETTINGS,
  getOutputFormat,
  resolveBitrateKbps,
  resolveChannelCount,
  resolveSampleRate,
  sanitizeExportSettings,
} from './outputFormats'

describe('outputFormats', () => {
  const mp3 = getOutputFormat('mp3')
  const wav = getOutputFormat('wav')
  const opus = getOutputFormat('ogg')
  const aac = getOutputFormat('m4a')

  it('keeps the source sample rate when the codec accepts it', () => {
    expect(resolveSampleRate(mp3, null, 44100)).toBe(44100)
    expect(resolveSampleRate(wav, null, 96000)).toBe(96000)
    expect(resolveSampleRate(wav, 22050, 48000)).toBe(22050)
  })

  it('picks the closest supported rate, preferring higher ones', () => {
    expect(resolveSampleRate(opus, null, 44100)).toBe(48000)
    expect(resolveSampleRate(aac, 22050, 48000)).toBe(44100)
    expect(resolveSampleRate(mp3, 96000, 44100)).toBe(48000)
  })

  it('limits the channel count', () => {
    expect(resolveChannelCount(mp3, 'original', 6)).toBe(2)
    expect(resolveChannelCount(wav, 'original', 6)).toBe(6)
    expect(resolveChannelCount(wav, 1, 2)).toBe(1)
  })

  it('resolves bitrates', () => {
    expect(resolveBitrateKbps(wav, 192)).toBeNull()
    expect(resolveBitrateKbps(mp3, 320)).toBe(320)
    expect(resolveBitrateKbps(opus, 320)).toBe(128)
  })

  it('repairs invalid stored settings', () => {
    expect(sanitizeExportSettings(null)).toEqual(DEFAULT_EXPORT_SETTINGS)
    expect(sanitizeExportSettings({ formatId: 'aiff', sampleRate: 12345, channels: 5, wavBitDepth: 8 })).toEqual(DEFAULT_EXPORT_SETTINGS)
    const valid = { formatId: 'flac', bitrateKbps: 128, wavBitDepth: 24, sampleRate: 48000, channels: 1 }
    expect(sanitizeExportSettings(valid)).toEqual(valid)
  })
})
