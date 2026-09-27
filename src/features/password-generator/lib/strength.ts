export interface Strength {
  /** 0 (very weak) to 4 (very strong). */
  level: 0 | 1 | 2 | 3 | 4
  label: 'Very weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong'
}

/** Entropy in bits of a password of `length` characters drawn uniformly from `poolSize` characters. */
export function estimateEntropyBits(length: number, poolSize: number): number {
  if (length <= 0 || poolSize <= 1) return 0
  return length * Math.log2(poolSize)
}

const LEVELS: readonly (Strength & { maxBits: number })[] = [
  { level: 0, label: 'Very weak', maxBits: 28 },
  { level: 1, label: 'Weak', maxBits: 36 },
  { level: 2, label: 'Fair', maxBits: 60 },
  { level: 3, label: 'Strong', maxBits: 80 },
  { level: 4, label: 'Very strong', maxBits: Infinity },
]

export function getStrength(bits: number): Strength {
  const { level, label } = LEVELS.find(({ maxBits }) => bits < maxBits)!
  return { level, label }
}
