import { describe, expect, it } from 'vitest'
import { baseName } from './fileName'

describe('baseName', () => {
  it('removes only the last extension', () => {
    expect(baseName('song.final.mp3')).toBe('song.final')
  })

  it('keeps names without an extension and dotfiles', () => {
    expect(baseName('recording')).toBe('recording')
    expect(baseName('.hidden')).toBe('.hidden')
  })
})
