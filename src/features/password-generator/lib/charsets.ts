export type CharsetId = 'lowercase' | 'uppercase' | 'digits' | 'symbols'

export interface CharsetDefinition {
  id: CharsetId
  label: string
  characters: string
}

export const CHARSETS: readonly CharsetDefinition[] = [
  { id: 'lowercase', label: 'Lowercase (a–z)', characters: 'abcdefghijklmnopqrstuvwxyz' },
  { id: 'uppercase', label: 'Uppercase (A–Z)', characters: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ' },
  { id: 'digits', label: 'Numbers (0–9)', characters: '0123456789' },
  { id: 'symbols', label: 'Symbols (!@#…)', characters: '!@#$%^&*()-_=+[]{};:,.<>?/~' },
]

/** Characters that are easy to confuse with each other in many fonts. */
export const AMBIGUOUS_CHARACTERS = 'Il1O0o'

/** The character strings of the enabled sets, without ambiguous characters if requested. */
export function buildCharsets(enabled: Record<CharsetId, boolean>, excludeAmbiguous: boolean): string[] {
  return CHARSETS.filter((charset) => enabled[charset.id]).map((charset) =>
    excludeAmbiguous
      ? [...charset.characters].filter((char) => !AMBIGUOUS_CHARACTERS.includes(char)).join('')
      : charset.characters,
  )
}
