import { describe, expect, it } from 'vitest'
import { asciiBytes, concatBytes } from './bytes'
import { detectC2pa } from './c2pa'
import { buildJpeg, buildPng, pngChunk } from './testUtils'

/** A JUMBF description box labelled `c2pa`, followed by some manifest text. */
function fakeManifest(text: string) {
  return concatBytes([new Uint8Array([0, 0, 0, 30]), asciiBytes('jumd'), new Uint8Array(16), new Uint8Array([3]), asciiBytes('c2pa\0'), asciiBytes(text)])
}

describe('detectC2pa', () => {
  it('finds a manifest in a PNG caBX chunk', () => {
    const png = buildPng([pngChunk('caBX', fakeManifest('\0c2pa.created\0Adobe Firefly\0digitalSourceType\0http://cv.iptc.org/newscodes/digitalsourcetype/trainedAlgorithmicMedia\0'))])
    const info = detectC2pa(png)
    expect(info.present).toBe(true)
    expect(info.declaresAi).toBe(true)
    expect(info.hints).toEqual(expect.arrayContaining(['c2pa.created', 'Adobe Firefly']))
  })

  it('ignores JUMBF boxes that are not C2PA and files without manifests', () => {
    const other = concatBytes([asciiBytes('jumd'), new Uint8Array(17), asciiBytes('other')])
    expect(detectC2pa(concatBytes([buildJpeg(), other])).present).toBe(false)
    expect(detectC2pa(buildJpeg())).toEqual({ present: false, hints: [], declaresAi: false })
  })
})
