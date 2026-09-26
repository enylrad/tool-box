import { describe, expect, it } from 'vitest'
import { parseMediaInfo, parseProgressTime, progressFraction } from './ffmpegLog'

describe('parseProgressTime', () => {
  it('reads the encoded time', () => {
    expect(parseProgressTime('frame=  120 fps= 30 q=28.0 size=     256kB time=00:01:02.50 bitrate= 335.5kbits/s')).toBe(62.5)
  })

  it('ignores other lines', () => {
    expect(parseProgressTime('size=N/A time=N/A bitrate=N/A')).toBeNull()
    expect(parseProgressTime('Press [q] to stop')).toBeNull()
  })
})

describe('progressFraction', () => {
  it('clamps to 0–1', () => {
    expect(progressFraction(5, 10)).toBe(0.5)
    expect(progressFraction(12, 10)).toBe(1)
  })

  it('is unknown without an expected duration', () => {
    expect(progressFraction(5, null)).toBeNull()
    expect(progressFraction(5, 0)).toBeNull()
  })
})

describe('parseMediaInfo', () => {
  const log = [
    "Input #0, mov,mp4,m4a,3gp,3g2,mj2, from '/input/clip.mov':",
    '  Duration: 00:00:12.34, start: 0.000000, bitrate: 5000 kb/s',
    '  Stream #0:0[0x1](und): Video: h264 (High) (avc1 / 0x31637661), yuv420p(tv, bt709), 1920x1080, 4800 kb/s, 30 fps',
    '  Stream #0:1[0x2](und): Audio: aac (LC) (mp4a / 0x6134706D), 48000 Hz, stereo, fltp, 128 kb/s',
  ]

  it('reads duration, size and streams', () => {
    expect(parseMediaInfo(log)).toEqual({ duration: 12.34, width: 1920, height: 1080, hasVideo: true, hasAudio: true })
  })

  it('swaps the size for rotated phone videos', () => {
    const rotated = [...log, '      displaymatrix: rotation of -90.00 degrees']
    expect(parseMediaInfo(rotated)).toMatchObject({ width: 1080, height: 1920 })
  })

  it('handles audio-only and unreadable files', () => {
    expect(parseMediaInfo([log[1], log[3]])).toEqual({ duration: 12.34, width: 0, height: 0, hasVideo: false, hasAudio: true })
    expect(parseMediaInfo(['/input/x: Invalid data found when processing input'])).toEqual({
      duration: null,
      width: 0,
      height: 0,
      hasVideo: false,
      hasAudio: false,
    })
  })
})
