/** Fills a typed array with random values, like `crypto.getRandomValues`. */
export type RandomSource = (array: Uint32Array<ArrayBuffer>) => void

const UINT32_RANGE = 2 ** 32

function cryptoRandomSource(array: Uint32Array<ArrayBuffer>) {
  crypto.getRandomValues(array)
}

/**
 * Returns a uniformly distributed integer in `[0, maxExclusive)`.
 *
 * Values from the top of the 32-bit range that would make some results more
 * likely than others (modulo bias) are rejected and drawn again.
 */
export function randomInt(maxExclusive: number, random: RandomSource = cryptoRandomSource): number {
  if (!Number.isInteger(maxExclusive) || maxExclusive < 1 || maxExclusive > UINT32_RANGE) {
    throw new RangeError(`maxExclusive must be an integer between 1 and 2^32, got ${maxExclusive}`)
  }
  const limit = UINT32_RANGE - (UINT32_RANGE % maxExclusive)
  const buffer = new Uint32Array(1)
  for (;;) {
    random(buffer)
    if (buffer[0] < limit) return buffer[0] % maxExclusive
  }
}

/** Shuffles an array in place (Fisher–Yates) and returns it. */
export function shuffle<T>(array: T[], random: RandomSource = cryptoRandomSource): T[] {
  for (let i = array.length - 1; i > 0; i--) {
    const j = randomInt(i + 1, random)
    ;[array[i], array[j]] = [array[j], array[i]]
  }
  return array
}
