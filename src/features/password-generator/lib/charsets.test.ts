import { describe, expect, it } from 'vitest'
import { AMBIGUOUS_CHARACTERS, buildCharsets } from './charsets'

const ALL = { lowercase: true, uppercase: true, digits: true, symbols: true }

describe('buildCharsets', () => {
  it('returns only the enabled sets', () => {
    expect(buildCharsets({ ...ALL, uppercase: false, symbols: false }, false)).toEqual([
      'abcdefghijklmnopqrstuvwxyz',
      '0123456789',
    ])
  })

  it('removes ambiguous characters when requested', () => {
    const joined = buildCharsets(ALL, true).join('')
    for (const char of AMBIGUOUS_CHARACTERS) expect(joined).not.toContain(char)
    expect(joined).toContain('a')
  })

  it('returns nothing when no set is enabled', () => {
    expect(buildCharsets({ lowercase: false, uppercase: false, digits: false, symbols: false }, false)).toEqual([])
  })
})
