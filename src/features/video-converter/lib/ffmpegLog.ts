import type { Size } from '../../../lib/cropGeometry'

export interface MediaInfo extends Size {
  /** Seconds, or `null` if ffmpeg could not tell. */
  duration: number | null
  hasVideo: boolean
  hasAudio: boolean
}

const hmsToSeconds = (hours: string, minutes: string, seconds: string) =>
  Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds)

/** Reads the `time=00:01:02.50` field of an ffmpeg progress line. */
export function parseProgressTime(line: string): number | null {
  const match = /time=\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(line)
  return match ? hmsToSeconds(match[1], match[2], match[3]) : null
}

/** Converts an encoded time into a 0–1 progress fraction. */
export function progressFraction(encodedSeconds: number, expectedSeconds: number | null): number | null {
  if (expectedSeconds === null || expectedSeconds <= 0) return null
  return Math.min(1, Math.max(0, encodedSeconds / expectedSeconds))
}

/**
 * Extracts duration, frame size and streams from the log of `ffmpeg -i <file>`.
 * Used when the browser itself cannot play the file (e.g. AVI or some MKV).
 */
export function parseMediaInfo(lines: string[]): MediaInfo {
  const log = lines.join('\n')
  const durationMatch = /Duration:\s*(\d+):(\d{2}):(\d{2}(?:\.\d+)?)/.exec(log)
  const videoLine = lines.find((line) => /Stream #\d+:\d+.*: Video:/.test(line))
  // `\b` avoids hex codec tags such as `0x31637661`.
  const sizeMatch = videoLine ? /\b(\d{2,5})x(\d{2,5})\b/.exec(videoLine) : null
  const rotationMatch = /rotation of (-?\d+(?:\.\d+)?) degrees/.exec(log)

  let width = sizeMatch ? Number(sizeMatch[1]) : 0
  let height = sizeMatch ? Number(sizeMatch[2]) : 0
  // ffmpeg auto-rotates phone videos, so a quarter turn swaps the frame size.
  if (rotationMatch && Math.abs(Math.round(Number(rotationMatch[1]))) % 180 === 90) {
    ;[width, height] = [height, width]
  }

  return {
    duration: durationMatch ? hmsToSeconds(durationMatch[1], durationMatch[2], durationMatch[3]) : null,
    width,
    height,
    hasVideo: videoLine !== undefined,
    hasAudio: lines.some((line) => /Stream #\d+:\d+.*: Audio:/.test(line)),
  }
}
