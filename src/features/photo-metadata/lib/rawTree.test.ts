import { describe, expect, it } from 'vitest'
import { buildMetadataTree, countLeaves, filterTree, formatRawValue, treeToJson } from './rawTree'
import { readTags } from './tags'
import { buildJpeg, SAMPLE_EXIF, SAMPLE_XMP, toArrayBuffer } from './testUtils'

describe('formatRawValue', () => {
  it('formats rationals, arrays and binary data', () => {
    expect(formatRawValue([1, 250])).toBe('1/250')
    expect(formatRawValue(['Google'])).toBe('Google')
    expect(formatRawValue(Array.from({ length: 20 }, (_, index) => index))).toMatch(/^\[0, 1, .*… 20 values\]$/)
    expect(formatRawValue(new Uint8Array(1500).buffer)).toBe('<binary data, 1,500 bytes>')
  })
})

describe('buildMetadataTree', () => {
  it('groups every tag and nests XMP structures', async () => {
    const tree = buildMetadataTree(await readTags(toArrayBuffer(buildJpeg({ exif: SAMPLE_EXIF, xmp: SAMPLE_XMP }))))
    expect(tree.map((node) => node.key)).toEqual(expect.arrayContaining(['EXIF', 'XMP', 'GPS (calculated)', 'File header']))
    const exif = tree.find((node) => node.key === 'EXIF')!
    expect(exif.children).toContainEqual({ key: 'ExposureTime', value: '1/250' })
    expect(exif.children).toContainEqual({ key: 'Orientation', value: 'right-top', raw: '6' })
    const history = tree.find((node) => node.key === 'XMP')!.children!.find((node) => node.key === 'History')!
    expect(history.children?.[0].children).toContainEqual({ key: 'action', value: 'saved' })
    expect(countLeaves(tree)).toBeGreaterThan(30)

    const filtered = filterTree(tree, 'serial')
    expect(filtered).toHaveLength(1)
    expect(filtered[0].children).toEqual([{ key: 'BodySerialNumber', value: 'ABC123' }])

    const json = treeToJson(tree) as Record<string, Record<string, unknown>>
    expect(json.EXIF.Make).toBe('Google')
  })
})
