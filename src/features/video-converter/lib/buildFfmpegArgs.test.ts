import { describe, expect, it } from 'vitest'
import { buildFfmpegArgs, buildVideoFilters, type ConversionOptions } from './buildFfmpegArgs'
import { IDENTITY_TRANSFORM } from './cropGeometry'
import { getOutputFormat } from './formats'

const base: ConversionOptions = {
  inputPath: '/input/clip.mov',
  outputPath: 'output.mp4',
  format: getOutputFormat('mp4'),
  trim: { start: 0, end: null },
  duration: 30,
  transform: IDENTITY_TRANSFORM,
}

const valueAfter = (args: string[], flag: string) => {
  const index = args.indexOf(flag)
  return index === -1 ? undefined : args[index + 1]
}

describe('buildVideoFilters', () => {
  it('returns nothing for the identity transform', () => {
    expect(buildVideoFilters(IDENTITY_TRANSFORM)).toEqual([])
  })

  it('crops, then flips, then rotates', () => {
    expect(
      buildVideoFilters({
        rotation: 90,
        flipHorizontal: true,
        flipVertical: false,
        crop: { x: 10, y: 20, width: 300, height: 200 },
      }),
    ).toEqual(['crop=300:200:10:20', 'hflip', 'transpose=1'])
  })

  it('maps each rotation', () => {
    expect(buildVideoFilters({ ...IDENTITY_TRANSFORM, rotation: 180 })).toEqual(['hflip', 'vflip'])
    expect(buildVideoFilters({ ...IDENTITY_TRANSFORM, rotation: 270 })).toEqual(['transpose=2'])
  })
})

describe('buildFfmpegArgs', () => {
  it('converts the whole file to MP4', () => {
    const args = buildFfmpegArgs(base)
    expect(args.slice(0, 3)).toEqual(['-hide_banner', '-i', '/input/clip.mov'])
    expect(args).not.toContain('-ss')
    expect(args).not.toContain('-t')
    expect(valueAfter(args, '-c:v')).toBe('libx264')
    expect(valueAfter(args, '-vf')).toBe('scale=trunc(iw/2)*2:trunc(ih/2)*2')
    expect(args.slice(-2)).toEqual(['-y', 'output.mp4'])
  })

  it('seeks before the input and limits the duration after it', () => {
    const args = buildFfmpegArgs({ ...base, trim: { start: 2.5, end: 10 } })
    expect(args.indexOf('-ss')).toBeLessThan(args.indexOf('-i'))
    expect(valueAfter(args, '-ss')).toBe('2.500')
    expect(args.indexOf('-t')).toBeGreaterThan(args.indexOf('-i'))
    expect(valueAfter(args, '-t')).toBe('7.500')
  })

  it('only limits the duration when trimming the end', () => {
    const args = buildFfmpegArgs({ ...base, trim: { start: 0, end: 5 } })
    expect(args).not.toContain('-ss')
    expect(valueAfter(args, '-t')).toBe('5.000')
  })

  it('keeps audio optional for video formats', () => {
    const args = buildFfmpegArgs(base)
    expect(args.join(' ')).toContain('-map 0:v:0 -map 0:a:0?')
  })

  it('rounds the crop to even sizes for H.264', () => {
    const args = buildFfmpegArgs({
      ...base,
      transform: { ...IDENTITY_TRANSFORM, crop: { x: 1, y: 1, width: 301, height: 201 }, rotation: 270 },
    })
    expect(valueAfter(args, '-vf')).toBe('crop=300:200:1:1,transpose=2,scale=trunc(iw/2)*2:trunc(ih/2)*2')
  })

  it('keeps odd crops for WebM', () => {
    const args = buildFfmpegArgs({
      ...base,
      format: getOutputFormat('webm'),
      outputPath: 'output.webm',
      transform: { ...IDENTITY_TRANSFORM, crop: { x: 0, y: 0, width: 301, height: 201 } },
    })
    expect(valueAfter(args, '-vf')).toBe('crop=301:201:0:0')
    expect(valueAfter(args, '-c:v')).toBe('libvpx')
  })

  it('builds a palette-based GIF without audio', () => {
    const args = buildFfmpegArgs({ ...base, format: getOutputFormat('gif'), outputPath: 'output.gif' })
    const filters = valueAfter(args, '-vf')
    expect(filters).toMatch(/^fps=12,scale=min\(480\\,iw\):-2/)
    expect(filters).toContain('palettegen')
    expect(filters).toContain('paletteuse')
    expect(args).toContain('-an')
  })

  it('drops the picture and ignores transforms for audio formats', () => {
    const args = buildFfmpegArgs({
      ...base,
      format: getOutputFormat('mp3'),
      outputPath: 'output.mp3',
      transform: { ...IDENTITY_TRANSFORM, rotation: 90 },
    })
    expect(args).toContain('-vn')
    expect(args).not.toContain('-vf')
    expect(valueAfter(args, '-map')).toBe('0:a:0')
    expect(valueAfter(args, '-c:a')).toBe('libmp3lame')
  })
})
