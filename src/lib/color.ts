const HEX_COLOR = /^#[0-9a-f]{6}$/i

export function isHexColor(value: string): boolean {
  return HEX_COLOR.test(value)
}

/** Returns `value` if it is a `#rrggbb` color, otherwise `fallback`. */
export function toSafeHexColor(value: string, fallback: string): string {
  return isHexColor(value) ? value.toLowerCase() : fallback
}

function channelToLinear(channel: number): number {
  const srgb = channel / 255
  return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4
}

/** WCAG relative luminance of a `#rrggbb` color, from 0 (black) to 1 (white). */
export function relativeLuminance(hex: string): number {
  const value = Number.parseInt(hex.slice(1), 16)
  const red = channelToLinear((value >> 16) & 0xff)
  const green = channelToLinear((value >> 8) & 0xff)
  const blue = channelToLinear(value & 0xff)
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue
}

/** WCAG contrast ratio between two `#rrggbb` colors, from 1 to 21. */
export function contrastRatio(first: string, second: string): number {
  const a = relativeLuminance(first)
  const b = relativeLuminance(second)
  return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)
}
