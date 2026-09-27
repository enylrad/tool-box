/** Evenly spaced "nice" values (1, 2, 2.5 or 5 × 10ⁿ) covering `min`…`max` with about `count` ticks. */
export function niceTicks(min: number, max: number, count = 5): number[] {
  if (!Number.isFinite(min) || !Number.isFinite(max) || count < 1) return []
  if (max <= min) return [min]
  const rawStep = (max - min) / count
  const magnitude = 10 ** Math.floor(Math.log10(rawStep))
  const step = [1, 2, 2.5, 5, 10].map((factor) => factor * magnitude).find((candidate) => candidate >= rawStep)!
  const ticks: number[] = []
  for (let value = Math.ceil(min / step) * step; value <= max + step * 1e-9; value += step) {
    // Round away floating point noise such as 0.30000000000000004.
    ticks.push(Math.round(value / step) * step)
  }
  return ticks
}
