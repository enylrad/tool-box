import { ascii, indexOfAscii } from './bytes'

export interface C2paInfo {
  present: boolean
  /** Readable strings found in the manifest (tool names, actions…), for display only. */
  hints: string[]
  /** The manifest declares the content as created by generative AI. */
  declaresAi: boolean
}

/** How far into a manifest we look for readable text. Manifests can embed thumbnails, so cap it. */
const MANIFEST_SCAN_BYTES = 256 * 1024
const MIN_STRING_LENGTH = 5

const INTERESTING = /adobe|photoshop|lightroom|firefly|openai|dall|chatgpt|google|gemini|imagen|microsoft|bing|designer|midjourney|samsung|leica|nikon|sony|canon|truepic|c2pa\.(created|edited|opened|placed|converted|cropped|filtered|color_adjustments|resized|drawing)/i

/**
 * Detects a C2PA "Content Credentials" manifest. Manifests live in JUMBF boxes
 * whose description box (`jumd`) is labelled `c2pa`, whatever the container
 * (JPEG APP11, PNG caBX, WebP/HEIF boxes), so scanning for that is format-agnostic.
 *
 * The signature is NOT verified: that needs certificate trust lists, which are online.
 */
export function detectC2pa(bytes: Uint8Array): C2paInfo {
  let start = -1
  for (let index = indexOfAscii(bytes, 'jumd'); index !== -1; index = indexOfAscii(bytes, 'jumd', index + 4)) {
    // jumd = type (4) + UUID (16) + toggles (1), then the NUL-terminated label.
    if (ascii(bytes, index + 21, 4) === 'c2pa') {
      start = index
      break
    }
  }
  if (start === -1) return { present: false, hints: [], declaresAi: false }

  const region = bytes.subarray(start, Math.min(bytes.length, start + MANIFEST_SCAN_BYTES))
  const strings = printableStrings(region)
  const hints = [...new Set(strings.filter((text) => INTERESTING.test(text)).map((text) => text.slice(0, 120)))].slice(0, 12)
  const declaresAi = strings.some((text) => /trainedAlgorithmicMedia/i.test(text))
  return { present: true, hints, declaresAi }
}

function printableStrings(bytes: Uint8Array) {
  const found: string[] = []
  let current = ''
  for (const byte of bytes) {
    if (byte >= 0x20 && byte < 0x7f) {
      current += String.fromCharCode(byte)
    } else {
      if (current.length >= MIN_STRING_LENGTH) found.push(current)
      current = ''
    }
  }
  if (current.length >= MIN_STRING_LENGTH) found.push(current)
  return found
}
