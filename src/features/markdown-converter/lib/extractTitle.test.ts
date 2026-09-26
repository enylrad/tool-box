import { describe, expect, it } from 'vitest'
import { extractTitle } from './extractTitle'

describe('extractTitle', () => {
  it('returns the first heading text', () => {
    expect(extractTitle('intro\n\n## Setup Guide\n\n# Later')).toBe('Setup Guide')
  })

  it('strips inline formatting and links', () => {
    expect(extractTitle('# **Bold** [link](https://x.y) `code`')).toBe('Bold link code')
  })

  it('ignores closing hashes', () => {
    expect(extractTitle('# Title ##')).toBe('Title')
  })

  it('uses the fallback when there is no heading', () => {
    expect(extractTitle('just text', 'Untitled')).toBe('Untitled')
  })
})
