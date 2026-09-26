import { frameCount, type AudioData, type FrameRange } from './audioData'

/**
 * Pure editing operations. Each returns a new `AudioData` and never mutates
 * its input, so previous versions can be kept for undo.
 */

function mapChannels(audio: AudioData, map: (samples: Float32Array) => Float32Array): AudioData {
  return { sampleRate: audio.sampleRate, channels: audio.channels.map(map) }
}

/** Applies `transform` to the samples inside `range` (a copy of each channel). */
function mapRange(
  audio: AudioData,
  { start, end }: FrameRange,
  transform: (sample: number, indexInRange: number, rangeLength: number) => number,
): AudioData {
  const length = end - start
  return mapChannels(audio, (samples) => {
    const result = new Float32Array(samples)
    for (let i = 0; i < length; i++) {
      result[start + i] = transform(samples[start + i], i, length)
    }
    return result
  })
}

/** Keeps only the frames inside `range`. */
export function trim(audio: AudioData, { start, end }: FrameRange): AudioData {
  return mapChannels(audio, (samples) => samples.slice(start, end))
}

/** Removes the frames inside `range`. */
export function deleteRange(audio: AudioData, { start, end }: FrameRange): AudioData {
  return mapChannels(audio, (samples) => {
    const result = new Float32Array(samples.length - (end - start))
    result.set(samples.subarray(0, start), 0)
    result.set(samples.subarray(end), start)
    return result
  })
}

export function silence(audio: AudioData, range: FrameRange): AudioData {
  return mapRange(audio, range, () => 0)
}

/** Linear fade from silence to full volume across `range`. */
export function fadeIn(audio: AudioData, range: FrameRange): AudioData {
  return mapRange(audio, range, (sample, i, length) => sample * (length <= 1 ? 1 : i / (length - 1)))
}

/** Linear fade from full volume to silence across `range`. */
export function fadeOut(audio: AudioData, range: FrameRange): AudioData {
  return mapRange(audio, range, (sample, i, length) => sample * (length <= 1 ? 0 : 1 - i / (length - 1)))
}

export function dbToGain(db: number): number {
  return 10 ** (db / 20)
}

/** Changes the volume by `db` decibels. Samples are clipped to −1…1. */
export function applyGain(audio: AudioData, range: FrameRange, db: number): AudioData {
  const gain = dbToGain(db)
  return mapRange(audio, range, (sample) => clipSample(sample * gain))
}

/** Highest absolute sample value inside `range` across all channels. */
export function peakLevel(audio: AudioData, { start, end }: FrameRange): number {
  let peak = 0
  for (const samples of audio.channels) {
    for (let i = start; i < end; i++) {
      const value = Math.abs(samples[i])
      if (value > peak) peak = value
    }
  }
  return peak
}

/** Scales `range` so its loudest sample reaches `targetDb` dBFS (default −1 dB). */
export function normalize(audio: AudioData, range: FrameRange, targetDb = -1): AudioData {
  const peak = peakLevel(audio, range)
  if (peak === 0) return audio
  const gain = dbToGain(targetDb) / peak
  return mapRange(audio, range, (sample) => sample * gain)
}

export function reverse(audio: AudioData, { start, end }: FrameRange): AudioData {
  return mapChannels(audio, (samples) => {
    const result = new Float32Array(samples)
    result.subarray(start, end).reverse()
    return result
  })
}

/** Mixes every channel down to a single one. */
export function toMono(audio: AudioData): AudioData {
  if (audio.channels.length <= 1) return audio
  const length = frameCount(audio)
  const mixed = new Float32Array(length)
  for (const samples of audio.channels) {
    for (let i = 0; i < length; i++) mixed[i] += samples[i]
  }
  const count = audio.channels.length
  for (let i = 0; i < length; i++) mixed[i] /= count
  return { sampleRate: audio.sampleRate, channels: [mixed] }
}

function clipSample(sample: number): number {
  return sample > 1 ? 1 : sample < -1 ? -1 : sample
}
