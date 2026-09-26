import { toEvenCrop, type Transform } from './cropGeometry'
import type { OutputFormat } from './formats'
import { isTrimmed, type TrimRange } from './timecode'

export interface ConversionOptions {
  inputPath: string
  outputPath: string
  format: OutputFormat
  trim: TrimRange
  /** Duration of the source in seconds, if known. */
  duration: number | null
  transform: Transform
}

const GIF_FRAME_RATE = 12
const GIF_MAX_WIDTH = 480

const seconds = (value: number) => value.toFixed(3)

/** Filters for crop → flip → rotate, in that order (the crop is in source pixels). */
export function buildVideoFilters({ crop, flipHorizontal, flipVertical, rotation }: Transform): string[] {
  const filters: string[] = []
  if (crop) filters.push(`crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`)
  if (flipHorizontal) filters.push('hflip')
  if (flipVertical) filters.push('vflip')
  if (rotation === 90) filters.push('transpose=1')
  if (rotation === 180) filters.push('hflip', 'vflip')
  if (rotation === 270) filters.push('transpose=2')
  return filters
}

/** Builds the ffmpeg command line (without the leading `ffmpeg`). */
export function buildFfmpegArgs({ inputPath, outputPath, format, trim, duration, transform }: ConversionOptions): string[] {
  const args = ['-hide_banner']

  const trimmed = isTrimmed(trim, duration)
  // Seeking before `-i` is fast, and accurate because the output is re-encoded.
  if (trimmed && trim.start > 0) args.push('-ss', seconds(trim.start))
  args.push('-i', inputPath)
  if (trimmed && trim.end !== null) args.push('-t', seconds(trim.end - trim.start))

  if (format.kind === 'audio') {
    args.push('-map', '0:a:0', '-vn')
  } else {
    const needsEven = format.requiresEvenDimensions
    const filters = buildVideoFilters(needsEven && transform.crop ? { ...transform, crop: toEvenCrop(transform.crop) } : transform)

    if (format.kind === 'animation') {
      filters.push(
        `fps=${GIF_FRAME_RATE}`,
        // The comma inside min() is escaped so it is not read as a filter separator.
        `scale=min(${GIF_MAX_WIDTH}\\,iw):-2:flags=lanczos`,
        'split[frames][copy];[copy]palettegen[palette];[frames][palette]paletteuse',
      )
      args.push('-map', '0:v:0', '-an')
    } else {
      // Sources with odd sizes (and no crop) still have to be rounded for H.264.
      if (needsEven) filters.push('scale=trunc(iw/2)*2:trunc(ih/2)*2')
      // `?` makes the audio optional so silent videos convert too.
      args.push('-map', '0:v:0', '-map', '0:a:0?')
    }

    if (filters.length > 0) args.push('-vf', filters.join(','))
  }

  args.push(...format.encoderArgs, '-y', outputPath)
  return args
}
