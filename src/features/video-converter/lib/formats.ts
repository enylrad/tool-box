export type OutputFormatId = 'mp4' | 'webm' | 'mov' | 'mkv' | 'avi' | 'gif' | 'mp3' | 'wav'

/** `video` keeps audio, `animation` is video without audio, `audio` drops the picture. */
export type OutputKind = 'video' | 'animation' | 'audio'

export interface OutputFormat {
  id: OutputFormatId
  label: string
  description: string
  extension: string
  mimeType: string
  kind: OutputKind
  /** Encoder flags placed after the filters. */
  encoderArgs: string[]
  /** H.264 needs even frame sizes, so the filter chain rounds them down. */
  requiresEvenDimensions: boolean
}

const H264_AAC = ['-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k']

export const OUTPUT_FORMATS: OutputFormat[] = [
  {
    id: 'mp4',
    label: 'MP4',
    description: 'H.264 + AAC. Plays everywhere.',
    extension: 'mp4',
    mimeType: 'video/mp4',
    kind: 'video',
    encoderArgs: [...H264_AAC, '-movflags', '+faststart'],
    requiresEvenDimensions: true,
  },
  {
    id: 'webm',
    label: 'WebM',
    description: 'VP8 + Vorbis. Open format for the web.',
    extension: 'webm',
    mimeType: 'video/webm',
    kind: 'video',
    // VP9 is far too slow for single-threaded WebAssembly, so VP8 in realtime mode is used.
    encoderArgs: ['-c:v', 'libvpx', '-deadline', 'realtime', '-cpu-used', '8', '-crf', '10', '-b:v', '2M', '-c:a', 'libvorbis', '-q:a', '4'],
    requiresEvenDimensions: false,
  },
  {
    id: 'mov',
    label: 'MOV',
    description: 'H.264 + AAC in a QuickTime container.',
    extension: 'mov',
    mimeType: 'video/quicktime',
    kind: 'video',
    encoderArgs: [...H264_AAC, '-movflags', '+faststart'],
    requiresEvenDimensions: true,
  },
  {
    id: 'mkv',
    label: 'MKV',
    description: 'H.264 + AAC in a Matroska container.',
    extension: 'mkv',
    mimeType: 'video/x-matroska',
    kind: 'video',
    encoderArgs: H264_AAC,
    requiresEvenDimensions: true,
  },
  {
    id: 'avi',
    label: 'AVI',
    description: 'MPEG-4 + MP3 for older players.',
    extension: 'avi',
    mimeType: 'video/x-msvideo',
    kind: 'video',
    encoderArgs: ['-c:v', 'mpeg4', '-q:v', '3', '-c:a', 'libmp3lame', '-q:a', '4'],
    requiresEvenDimensions: true,
  },
  {
    id: 'gif',
    label: 'GIF',
    description: 'Looping animation, 12 fps, up to 480 px wide.',
    extension: 'gif',
    mimeType: 'image/gif',
    kind: 'animation',
    encoderArgs: ['-loop', '0'],
    requiresEvenDimensions: false,
  },
  {
    id: 'mp3',
    label: 'MP3',
    description: 'Extract the audio track only.',
    extension: 'mp3',
    mimeType: 'audio/mpeg',
    kind: 'audio',
    encoderArgs: ['-c:a', 'libmp3lame', '-q:a', '2'],
    requiresEvenDimensions: false,
  },
  {
    id: 'wav',
    label: 'WAV',
    description: 'Extract the audio track, uncompressed.',
    extension: 'wav',
    mimeType: 'audio/wav',
    kind: 'audio',
    encoderArgs: ['-c:a', 'pcm_s16le'],
    requiresEvenDimensions: false,
  },
]

export const DEFAULT_FORMAT_ID: OutputFormatId = 'mp4'

export function getOutputFormat(id: OutputFormatId): OutputFormat {
  return OUTPUT_FORMATS.find((format) => format.id === id) ?? OUTPUT_FORMATS[0]
}

/** File picker filter. Extensions are listed because browsers often leave their MIME type empty. */
export const VIDEO_ACCEPT = 'video/*,.mkv,.avi,.mov,.m4v,.flv,.wmv,.3gp,.ts,.mts,.mpg,.mpeg,.ogv'
