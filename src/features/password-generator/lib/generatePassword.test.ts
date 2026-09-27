import { describe, expect, it } from 'vitest'
import { AMBIGUOUS_CHARACTERS } from './charsets'
import { DEFAULT_PASSWORD_OPTIONS, generatePassword, getPoolSize, type PasswordOptions } from './generatePassword'

const options = (overrides: Partial<PasswordOptions> = {}): PasswordOptions => ({
  ...DEFAULT_PASSWORD_OPTIONS,
  ...overrides,
})

describe('generatePassword', () => {
  it('has the requested length', () => {
    expect(generatePassword(options({ length: 4 }))).toHaveLength(4)
    expect(generatePassword(options({ length: 128 }))).toHaveLength(128)
  })

  it('only uses the enabled character types', () => {
    for (let i = 0; i < 50; i++) {
      expect(generatePassword(options({ uppercase: false, symbols: false }))).toMatch(/^[a-z0-9]+$/)
    }
  })

  it('includes every enabled character type', () => {
    for (let i = 0; i < 200; i++) {
      const password = generatePassword(options({ length: 4 }))
      expect(password).toMatch(/[a-z]/)
      expect(password).toMatch(/[A-Z]/)
      expect(password).toMatch(/[0-9]/)
      expect(password).toMatch(/[^a-zA-Z0-9]/)
    }
  })

  it('leaves out ambiguous characters when requested', () => {
    for (let i = 0; i < 50; i++) {
      const password = generatePassword(options({ length: 64, excludeAmbiguous: true }))
      for (const char of AMBIGUOUS_CHARACTERS) expect(password).not.toContain(char)
    }
  })

  it('produces different passwords each time', () => {
    const passwords = new Set(Array.from({ length: 100 }, () => generatePassword(options())))
    expect(passwords.size).toBe(100)
  })

  it('rejects options without character types or with an invalid length', () => {
    expect(() =>
      generatePassword(options({ lowercase: false, uppercase: false, digits: false, symbols: false })),
    ).toThrow()
    expect(() => generatePassword(options({ length: 3 }))).toThrow(RangeError)
    expect(() => generatePassword(options({ length: 129 }))).toThrow(RangeError)
  })
})

describe('getPoolSize', () => {
  it('counts the available characters', () => {
    expect(getPoolSize(options({ uppercase: false, symbols: false }))).toBe(36)
    expect(getPoolSize(options({ uppercase: false, symbols: false, excludeAmbiguous: true }))).toBe(32)
  })
})
