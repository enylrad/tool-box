/** How many passwords can be generated at once. */
export const COUNT_OPTIONS = [
  { value: '1', label: '1' },
  { value: '5', label: '5' },
  { value: '10', label: '10' },
] as const

export type PasswordCount = (typeof COUNT_OPTIONS)[number]['value']
