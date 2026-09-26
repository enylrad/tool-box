/**
 * Plain, immutable representation of decoded audio. Unlike `AudioBuffer` it can
 * be created and inspected in unit tests without the Web Audio API.
 */
export interface AudioData {
  sampleRate: number
  /** One array of samples (−1…1) per channel, all of the same length. */
  channels: Float32Array[]
}

/** A range of frames: `start` is inclusive, `end` is exclusive. */
export interface FrameRange {
  start: number
  end: number
}

/** A range in seconds, as shown to the user. */
export interface TimeRange {
  start: number
  end: number
}

export function frameCount(audio: AudioData): number {
  return audio.channels[0]?.length ?? 0
}

export function durationOf(audio: AudioData): number {
  return frameCount(audio) / audio.sampleRate
}

export function secondsToFrames(seconds: number, sampleRate: number): number {
  return Math.round(seconds * sampleRate)
}

/** Converts a time range to a frame range clamped to the audio length. */
export function toFrameRange(audio: AudioData, range: TimeRange): FrameRange {
  const total = frameCount(audio)
  const a = clamp(secondsToFrames(range.start, audio.sampleRate), 0, total)
  const b = clamp(secondsToFrames(range.end, audio.sampleRate), 0, total)
  return { start: Math.min(a, b), end: Math.max(a, b) }
}

/** The frames an edit applies to: the selection if it is not empty, otherwise the whole audio. */
export function targetRange(audio: AudioData, selection: TimeRange | null): FrameRange {
  if (selection) {
    const range = toFrameRange(audio, selection)
    if (range.end > range.start) return range
  }
  return { start: 0, end: frameCount(audio) }
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max)
}

export function fromAudioBuffer(buffer: AudioBuffer): AudioData {
  const channels: Float32Array[] = []
  for (let channel = 0; channel < buffer.numberOfChannels; channel++) {
    // Copy so later edits never mutate the decoded buffer.
    channels.push(new Float32Array(buffer.getChannelData(channel)))
  }
  return { sampleRate: buffer.sampleRate, channels }
}

export function toAudioBuffer(audio: AudioData, range?: FrameRange): AudioBuffer {
  const start = range?.start ?? 0
  const end = range?.end ?? frameCount(audio)
  const buffer = new AudioBuffer({
    numberOfChannels: audio.channels.length,
    // AudioBuffer cannot be empty.
    length: Math.max(1, end - start),
    sampleRate: audio.sampleRate,
  })
  audio.channels.forEach((samples, channel) => {
    buffer.copyToChannel(samples.subarray(start, end) as Float32Array<ArrayBuffer>, channel)
  })
  return buffer
}
