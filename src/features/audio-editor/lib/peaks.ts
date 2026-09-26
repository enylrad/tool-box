import { frameCount, type AudioData } from './audioData'

export interface Peak {
  min: number
  max: number
}

/**
 * Summarizes the audio into `bucketCount` min/max pairs (one per pixel column)
 * so the waveform can be drawn without iterating every sample on each render.
 * All channels are combined.
 */
export function computePeaks(audio: AudioData, bucketCount: number): Peak[] {
  const total = frameCount(audio)
  const buckets = Math.max(0, Math.floor(bucketCount))
  const peaks: Peak[] = []
  if (total === 0) return Array.from({ length: buckets }, () => ({ min: 0, max: 0 }))

  for (let bucket = 0; bucket < buckets; bucket++) {
    const start = Math.floor((bucket * total) / buckets)
    // Every bucket covers at least one frame, even when zoomed past sample level.
    const end = Math.max(start + 1, Math.floor(((bucket + 1) * total) / buckets))
    let min = 0
    let max = 0
    for (const samples of audio.channels) {
      for (let i = start; i < end && i < total; i++) {
        const value = samples[i]
        if (value < min) min = value
        if (value > max) max = value
      }
    }
    peaks.push({ min, max })
  }
  return peaks
}
