import { describe, expect, it } from 'vitest'
import { getTextStats } from './textStats'

describe('getTextStats', () => {
  it('returns zeros for empty text', () => {
    expect(getTextStats('')).toEqual({
      words: 0,
      characters: 0,
      charactersNoSpaces: 0,
      sentences: 0,
      paragraphs: 0,
      lines: 0,
    })
  })

  it('counts words, ignoring punctuation and extra whitespace', () => {
    expect(getTextStats('  Hello,   world!  — how are you? ').words).toBe(5)
  })

  it('keeps contractions and accented words together', () => {
    expect(getTextStats("Don't worry, la canción está aquí.").words).toBe(6)
  })

  it('counts characters with and without whitespace', () => {
    const stats = getTextStats('ab c\td\n')
    expect(stats.characters).toBe(7)
    expect(stats.charactersNoSpaces).toBe(4)
  })

  it('counts an emoji or a combined character as a single character', () => {
    expect(getTextStats('👍🏽é').characters).toBe(2)
  })

  it('counts sentences and ignores punctuation-only fragments', () => {
    expect(getTextStats('One. Two? Three! ...').sentences).toBe(3)
  })

  it('counts paragraphs separated by blank lines', () => {
    const stats = getTextStats('First line\nstill first\n\n\n  \nSecond\r\n\r\nThird')
    expect(stats.paragraphs).toBe(3)
    expect(stats.lines).toBe(8)
  })
})
