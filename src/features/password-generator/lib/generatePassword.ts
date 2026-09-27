import { buildCharsets, type CharsetId } from './charsets'
import { randomInt, shuffle, type RandomSource } from './secureRandom'

export const MIN_LENGTH = 4
export const MAX_LENGTH = 128

export interface PasswordOptions extends Record<CharsetId, boolean> {
  length: number
  excludeAmbiguous: boolean
}

export const DEFAULT_PASSWORD_OPTIONS: PasswordOptions = {
  length: 16,
  lowercase: true,
  uppercase: true,
  digits: true,
  symbols: true,
  excludeAmbiguous: false,
}

/** Number of distinct characters a password can be made of with these options. */
export function getPoolSize(options: PasswordOptions): number {
  return new Set(buildCharsets(options, options.excludeAmbiguous).join('')).size
}

/**
 * Generates a random password.
 *
 * Every enabled character type appears at least once; the remaining characters
 * are drawn from all enabled types together and the result is shuffled.
 */
export function generatePassword(options: PasswordOptions, random?: RandomSource): string {
  const charsets = buildCharsets(options, options.excludeAmbiguous)
  if (charsets.length === 0) throw new Error('Choose at least one character type.')
  const { length } = options
  if (!Number.isInteger(length) || length < MIN_LENGTH || length > MAX_LENGTH) {
    throw new RangeError(`Length must be between ${MIN_LENGTH} and ${MAX_LENGTH}.`)
  }

  const pick = (characters: string) => characters[randomInt(characters.length, random)]
  const pool = charsets.join('')
  const chars = charsets.map(pick)
  while (chars.length < length) chars.push(pick(pool))
  return shuffle(chars, random).join('')
}
