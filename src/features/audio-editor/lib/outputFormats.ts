export type OutputFormatId = 'mp3' | 'wav' | 'flac' | 'm4a' | 'ogg' | 'webm'
export type WavBitDepth = 16 | 24 | 32
export type EncoderKind = 'builtin' | 'polyfilled' | 'webcodecs'

export interface OutputFormatDefinition {
  id: OutputFormatId
  label: string
  extension: string
  description: string
  lossless: boolean
  /** Bitrates offered to the user, in kbps. Empty for lossless formats. */
  bitratesKbps: number[]
  defaultBitrateKbps?: number
  /** Sample rates the codec accepts. `null` means any rate. */
  supportedSampleRates: number[] | null
  maxChannels: number
  /**
   * `builtin`: pure JS, always available. `polyfilled`: WebCodecs when available,
   * otherwise a bundled WebAssembly encoder. `webcodecs`: depends on the browser.
   */
  encoder: EncoderKind
}

const MP3_SAMPLE_RATES = [8000, 11025, 12000, 16000, 22050, 24000, 32000, 44100, 48000]

export const OUTPUT_FORMATS: OutputFormatDefinition[] = [
  {
    id: 'mp3',
    label: 'MP3',
    extension: 'mp3',
    description: 'Plays everywhere. Good quality at a small size.',
    lossless: false,
    bitratesKbps: [96, 128, 192, 256, 320],
    defaultBitrateKbps: 192,
    supportedSampleRates: MP3_SAMPLE_RATES,
    maxChannels: 2,
    encoder: 'polyfilled',
  },
  {
    id: 'wav',
    label: 'WAV',
    extension: 'wav',
    description: 'Uncompressed. Largest files, ideal for further editing.',
    lossless: true,
    bitratesKbps: [],
    supportedSampleRates: null,
    maxChannels: 8,
    encoder: 'builtin',
  },
  {
    id: 'flac',
    label: 'FLAC',
    extension: 'flac',
    description: 'Lossless compression. About half the size of WAV.',
    lossless: true,
    bitratesKbps: [],
    supportedSampleRates: null,
    maxChannels: 8,
    encoder: 'polyfilled',
  },
  {
    id: 'm4a',
    label: 'M4A (AAC)',
    extension: 'm4a',
    description: 'Apple devices and most players. Better than MP3 at the same size.',
    lossless: false,
    bitratesKbps: [96, 128, 192, 256],
    defaultBitrateKbps: 192,
    supportedSampleRates: [44100, 48000],
    maxChannels: 2,
    encoder: 'polyfilled',
  },
  {
    id: 'ogg',
    label: 'OGG (Opus)',
    extension: 'ogg',
    description: 'Excellent quality at low bitrates. Great for voice.',
    lossless: false,
    bitratesKbps: [32, 64, 96, 128, 192],
    defaultBitrateKbps: 128,
    supportedSampleRates: [48000],
    maxChannels: 2,
    encoder: 'webcodecs',
  },
  {
    id: 'webm',
    label: 'WebM (Opus)',
    extension: 'webm',
    description: 'Opus audio for the web.',
    lossless: false,
    bitratesKbps: [32, 64, 96, 128, 192],
    defaultBitrateKbps: 128,
    supportedSampleRates: [48000],
    maxChannels: 2,
    encoder: 'webcodecs',
  },
]

export function getOutputFormat(id: OutputFormatId): OutputFormatDefinition {
  const format = OUTPUT_FORMATS.find((candidate) => candidate.id === id)
  if (!format) throw new Error(`Unknown output format: ${id}`)
  return format
}

/** Sample rate choices offered in the UI; `null` keeps the original rate. */
export const SAMPLE_RATE_OPTIONS: (number | null)[] = [null, 22050, 32000, 44100, 48000, 96000]

export type ChannelOption = 'original' | 1 | 2

export interface ExportSettings {
  formatId: OutputFormatId
  bitrateKbps: number
  wavBitDepth: WavBitDepth
  sampleRate: number | null
  channels: ChannelOption
}

export const DEFAULT_EXPORT_SETTINGS: ExportSettings = {
  formatId: 'mp3',
  bitrateKbps: 192,
  wavBitDepth: 16,
  sampleRate: null,
  channels: 'original',
}

/**
 * The sample rate the file will actually be written with: the requested rate
 * (or the source rate) if the codec accepts it, otherwise the closest rate the
 * codec supports, preferring higher rates so quality is not lost.
 */
export function resolveSampleRate(format: OutputFormatDefinition, requested: number | null, source: number): number {
  const desired = requested ?? source
  const supported = format.supportedSampleRates
  if (!supported || supported.includes(desired)) return desired
  const higher = supported.filter((rate) => rate >= desired)
  if (higher.length > 0) return Math.min(...higher)
  return Math.max(...supported)
}

/** The channel count the file will actually be written with. */
export function resolveChannelCount(format: OutputFormatDefinition, requested: ChannelOption, source: number): number {
  const desired = requested === 'original' ? source : requested
  return Math.min(desired, format.maxChannels)
}

/** Bitrate to use for `format`, falling back to its default when `requested` is not offered. */
export function resolveBitrateKbps(format: OutputFormatDefinition, requested: number): number | null {
  if (format.lossless) return null
  return format.bitratesKbps.includes(requested) ? requested : (format.defaultBitrateKbps ?? format.bitratesKbps[0])
}

/** Repairs settings read from storage (older versions, manual edits) so they are always usable. */
export function sanitizeExportSettings(value: unknown): ExportSettings {
  const input = (typeof value === 'object' && value !== null ? value : {}) as Partial<ExportSettings>
  const defaults = DEFAULT_EXPORT_SETTINGS
  const formatId = OUTPUT_FORMATS.some((format) => format.id === input.formatId) ? input.formatId! : defaults.formatId
  return {
    formatId,
    bitrateKbps: typeof input.bitrateKbps === 'number' ? input.bitrateKbps : defaults.bitrateKbps,
    wavBitDepth: input.wavBitDepth === 24 || input.wavBitDepth === 32 ? input.wavBitDepth : 16,
    sampleRate: SAMPLE_RATE_OPTIONS.includes(input.sampleRate ?? null) ? (input.sampleRate ?? null) : null,
    channels: input.channels === 1 || input.channels === 2 ? input.channels : 'original',
  }
}
