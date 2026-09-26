import { ALL_FORMATS, BlobSource, Input } from 'mediabunny'
import { fromAudioBuffer, type AudioData } from './audioData'

/** Fallback when the container cannot be inspected; the browser's default rate. */
const FALLBACK_SAMPLE_RATE = 48000

/** Reads the file's native sample rate so decoding does not resample it. */
async function readSampleRate(file: Blob): Promise<number | null> {
  const input = new Input({ source: new BlobSource(file), formats: ALL_FORMATS })
  try {
    const track = await input.getPrimaryAudioTrack()
    return track ? await track.getSampleRate() : null
  } catch {
    return null
  } finally {
    input.dispose()
  }
}

/**
 * Decodes an audio (or video) file into raw samples with the Web Audio API.
 *
 * `decodeAudioData` resamples to its context's rate, so an OfflineAudioContext
 * with the file's own rate is used to keep the original sample rate.
 */
export async function decodeAudioFile(file: Blob): Promise<AudioData> {
  const sampleRate = (await readSampleRate(file)) ?? FALLBACK_SAMPLE_RATE
  const context = new OfflineAudioContext({ numberOfChannels: 1, length: 1, sampleRate })
  const buffer = await context.decodeAudioData(await file.arrayBuffer())
  if (buffer.length === 0) throw new Error('The file contains no audio.')
  return fromAudioBuffer(buffer)
}
