import { create } from 'qrcode'

export type ErrorCorrectionLevel = 'L' | 'M' | 'Q' | 'H'

export interface QrMatrix {
  /** Number of modules per side (21 for version 1, +4 per version). */
  size: number
  version: number
  isDark: (row: number, col: number) => boolean
  /** True for function patterns (finders, timing, alignment, format and version info) rather than data. */
  isFunctionModule: (row: number, col: number) => boolean
}

export const FINDER_SIZE = 7

export class QrTooLongError extends Error {
  constructor() {
    super('The content is too long to fit in a QR code.')
    this.name = 'QrTooLongError'
  }
}

/** Encodes `data` (UTF-8) and returns the raw module matrix. */
export function createQrMatrix(data: string, errorCorrectionLevel: ErrorCorrectionLevel): QrMatrix {
  try {
    const { modules, version } = create(data, { errorCorrectionLevel })
    return {
      size: modules.size,
      version,
      isDark: (row, col) => Boolean(modules.get(row, col)),
      isFunctionModule: (row, col) => Boolean(modules.isReserved(row, col)),
    }
  } catch (cause) {
    if (cause instanceof Error && /too big|amount of data/i.test(cause.message)) throw new QrTooLongError()
    throw cause
  }
}

/** Top-left corners of the three finder patterns ("eyes") of a symbol. */
export function finderOrigins(size: number): Array<[row: number, col: number]> {
  return [
    [0, 0],
    [0, size - FINDER_SIZE],
    [size - FINDER_SIZE, 0],
  ]
}

export function isFinderModule(size: number, row: number, col: number): boolean {
  return finderOrigins(size).some(
    ([originRow, originCol]) =>
      row >= originRow && row < originRow + FINDER_SIZE && col >= originCol && col < originCol + FINDER_SIZE,
  )
}
