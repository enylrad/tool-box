export interface TextStats {
  words: number
  /** User-perceived characters: an emoji or an accented letter counts as one. */
  characters: number
  charactersNoSpaces: number
  sentences: number
  paragraphs: number
  lines: number
}

// Intl.Segmenter understands every language (including ones without spaces,
// like Chinese or Japanese) and keeps contractions such as "don't" together.
const wordSegmenter = new Intl.Segmenter(undefined, { granularity: 'word' })
const sentenceSegmenter = new Intl.Segmenter(undefined, { granularity: 'sentence' })
const graphemeSegmenter = new Intl.Segmenter(undefined, { granularity: 'grapheme' })

const WHITESPACE = /\s/
const HAS_LETTER_OR_NUMBER = /[\p{L}\p{N}]/u
const BLANK_LINES = /\n\s*\n/

function countWords(text: string): number {
  let count = 0
  for (const segment of wordSegmenter.segment(text)) {
    if (segment.isWordLike) count++
  }
  return count
}

function countCharacters(text: string) {
  let characters = 0
  let charactersNoSpaces = 0
  for (const { segment } of graphemeSegmenter.segment(text)) {
    characters++
    if (!WHITESPACE.test(segment)) charactersNoSpaces++
  }
  return { characters, charactersNoSpaces }
}

function countSentences(text: string): number {
  let count = 0
  for (const { segment } of sentenceSegmenter.segment(text)) {
    // Skip fragments made only of punctuation or whitespace, e.g. a stray "...".
    if (HAS_LETTER_OR_NUMBER.test(segment)) count++
  }
  return count
}

function countParagraphs(text: string): number {
  return text.split(BLANK_LINES).filter((paragraph) => paragraph.trim() !== '').length
}

function countLines(text: string): number {
  return text === '' ? 0 : text.split('\n').length
}

/** Counts words, characters, sentences, paragraphs and lines in `text`. */
export function getTextStats(text: string): TextStats {
  const normalized = text.replace(/\r\n?/g, '\n')
  return {
    words: countWords(normalized),
    ...countCharacters(normalized),
    sentences: countSentences(normalized),
    paragraphs: countParagraphs(normalized),
    lines: countLines(normalized),
  }
}
