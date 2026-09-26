import {
  AudioBufferSource,
  BufferTarget,
  canEncodeAudio,
  FlacOutputFormat,
  Mp3OutputFormat,
  Mp4OutputFormat,
  OggOutputFormat,
  Output,
  Quality,
  WavOutputFormat,
  WebMOutputFormat,
  type AudioCodec,
  type OutputFormat,
} from 'mediabunny'
import { frameCount, toAudioBuffer, type AudioData } from './audioData'
import {
  getOutputFormat,
  OUTPUT_FORMATS,
  resolveBitrateKbps,
  resolveChannelCount,
  resolveSampleRate,
  type ExportSettings,
  type OutputFormatId,
  type WavBitDepth,
} from './outputFormats'

/**
 * Encoding with Mediabunny. This module is only loaded on demand (it is
 * imported dynamically by `useAudioExport`); the WebAssembly encoders are
 * loaded even later, only when the browser has no native encoder.
 */

const WAV_CODECS: Record<WavBitDepth, AudioCodec> = { 16: 'pcm-s16', 24: 'pcm-s24', 32: 'pcm-f32' }

/** Frames per chunk passed to the encoder, so progress can be reported. */
const CHUNK_SECONDS = 2

function codecFor(formatId: OutputFormatId, wavBitDepth: WavBitDepth): AudioCodec {
  switch (formatId) {
    case 'mp3':
      return 'mp3'
    case 'wav':
      return WAV_CODECS[wavBitDepth]
    case 'flac':
      return 'flac'
    case 'm4a':
      return 'aac'
    case 'ogg':
    case 'webm':
      return 'opus'
  }
}

function containerFor(formatId: OutputFormatId): OutputFormat {
  switch (formatId) {
    case 'mp3':
      return new Mp3OutputFormat()
    case 'wav':
      return new WavOutputFormat()
    case 'flac':
      return new FlacOutputFormat()
    case 'm4a':
      return new Mp4OutputFormat()
    case 'ogg':
      return new OggOutputFormat()
    case 'webm':
      return new WebMOutputFormat()
  }
}

const MIME_TYPES: Record<OutputFormatId, string> = {
  mp3: 'audio/mpeg',
  wav: 'audio/wav',
  flac: 'audio/flac',
  m4a: 'audio/mp4',
  ogg: 'audio/ogg',
  webm: 'audio/webm',
}

const registeredPolyfills = new Set<AudioCodec>()

/** Registers the bundled WebAssembly encoder for `codec` if the browser cannot encode it natively. */
async function ensureEncoder(codec: AudioCodec): Promise<void> {
  if (registeredPolyfills.has(codec)) return
  if (codec !== 'mp3' && codec !== 'flac' && codec !== 'aac') return
  if (await canEncodeAudio(codec)) return

  if (codec === 'mp3') {
    const { registerMp3Encoder } = await import('@mediabunny/mp3-encoder')
    registerMp3Encoder()
  } else if (codec === 'flac') {
    const { registerFlacEncoder } = await import('@mediabunny/flac-encoder')
    registerFlacEncoder()
  } else {
    const { registerAacEncoder } = await import('@mediabunny/aac-encoder')
    registerAacEncoder()
  }
  registeredPolyfills.add(codec)
}

/** Which formats this browser can write. Formats with a bundled encoder are always available. */
export async function detectAvailableFormats(): Promise<Record<OutputFormatId, boolean>> {
  const opus = await canEncodeAudio('opus', { numberOfChannels: 2, sampleRate: 48000 }).catch(() => false)
  const entries = OUTPUT_FORMATS.map((format) => [format.id, format.encoder === 'webcodecs' ? opus : true] as const)
  return Object.fromEntries(entries) as Record<OutputFormatId, boolean>
}

/** Encodes `audio` into the format described by `settings` and returns the file. */
export async function encodeAudio(
  audio: AudioData,
  settings: ExportSettings,
  onProgress: (fraction: number) => void,
): Promise<Blob> {
  const format = getOutputFormat(settings.formatId)
  const codec = codecFor(format.id, settings.wavBitDepth)
  const bitrateKbps = resolveBitrateKbps(format, settings.bitrateKbps)
  await ensureEncoder(codec)

  const output = new Output({ format: containerFor(format.id), target: new BufferTarget() })
  const source = new AudioBufferSource({
    codec,
    quality:
      bitrateKbps === null
        ? undefined
        : new Quality({
            bitrate: bitrateKbps * 1000,
            // Users expect "192 kbps MP3" to mean constant bitrate; Opus and AAC are better as VBR.
            bitrateMode: codec === 'mp3' ? 'constant' : 'variable',
          }),
    transform: {
      sampleRate: resolveSampleRate(format, settings.sampleRate, audio.sampleRate),
      numberOfChannels: resolveChannelCount(format, settings.channels, audio.channels.length),
    },
  })
  output.addAudioTrack(source)

  try {
    await output.start()
    const total = frameCount(audio)
    const chunkFrames = Math.max(1, Math.round(CHUNK_SECONDS * audio.sampleRate))
    for (let start = 0; start < total; start += chunkFrames) {
      const end = Math.min(total, start + chunkFrames)
      await source.add(toAudioBuffer(audio, { start, end }))
      onProgress(end / total)
    }
    source.close()
    await output.finalize()
  } catch (error) {
    if (output.state !== 'finalized') await output.cancel().catch(() => undefined)
    throw error
  }

  const buffer = (output.target as BufferTarget).buffer
  if (!buffer) throw new Error('The encoder produced no data.')
  return new Blob([buffer], { type: MIME_TYPES[format.id] })
}
