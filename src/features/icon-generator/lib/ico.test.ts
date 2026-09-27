import { describe, expect, it } from 'vitest'
import { encodeIco } from './ico'

const fakePng = (length: number, fill: number) => new Uint8Array(length).fill(fill)

describe('encodeIco', () => {
  it('writes the header, one directory entry per image and the image data', () => {
    const ico = encodeIco([
      { size: 32, png: fakePng(5, 2) },
      { size: 16, png: fakePng(3, 1) },
    ])
    const view = new DataView(ico.buffer)

    expect(view.getUint16(0, true)).toBe(0)
    expect(view.getUint16(2, true)).toBe(1)
    expect(view.getUint16(4, true)).toBe(2)
    expect(ico.length).toBe(6 + 2 * 16 + 3 + 5)

    // Entries are sorted from small to large.
    expect(view.getUint8(6)).toBe(16)
    expect(view.getUint16(6 + 4, true)).toBe(1)
    expect(view.getUint16(6 + 6, true)).toBe(32)
    expect(view.getUint32(6 + 8, true)).toBe(3)
    expect(view.getUint32(6 + 12, true)).toBe(38)
    expect([...ico.slice(38, 41)]).toEqual([1, 1, 1])

    expect(view.getUint8(22)).toBe(32)
    expect(view.getUint32(22 + 8, true)).toBe(5)
    expect(view.getUint32(22 + 12, true)).toBe(41)
    expect([...ico.slice(41)]).toEqual([2, 2, 2, 2, 2])
  })

  it('stores 256 px as 0 in the one-byte size fields', () => {
    const view = new DataView(encodeIco([{ size: 256, png: fakePng(1, 0) }]).buffer)
    expect(view.getUint8(6)).toBe(0)
    expect(view.getUint8(7)).toBe(0)
  })

  it('rejects empty input and unsupported sizes', () => {
    expect(() => encodeIco([])).toThrow()
    expect(() => encodeIco([{ size: 512, png: fakePng(1, 0) }])).toThrow()
    expect(() => encodeIco([{ size: 0, png: fakePng(1, 0) }])).toThrow()
  })
})
