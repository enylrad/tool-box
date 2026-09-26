/** Immutable undo/redo stack. */
export interface History<T> {
  past: T[]
  present: T
  future: T[]
}

export const DEFAULT_HISTORY_LIMIT = 20

/** Rough memory budget for undo snapshots, which are full copies of the audio. */
const HISTORY_MEMORY_BUDGET_BYTES = 512 * 1024 * 1024

/** How many undo steps fit in the memory budget for a snapshot of `snapshotBytes` (at least 1). */
export function historyLimitFor(snapshotBytes: number, maxSteps = DEFAULT_HISTORY_LIMIT): number {
  if (snapshotBytes <= 0) return maxSteps
  return Math.max(1, Math.min(maxSteps, Math.floor(HISTORY_MEMORY_BUDGET_BYTES / snapshotBytes)))
}

export function createHistory<T>(present: T): History<T> {
  return { past: [], present, future: [] }
}

/** Records a new state; the oldest entries are dropped beyond `limit` undo steps. */
export function pushHistory<T>(history: History<T>, next: T, limit = DEFAULT_HISTORY_LIMIT): History<T> {
  const past = [...history.past, history.present].slice(-limit)
  return { past, present: next, future: [] }
}

export function undo<T>(history: History<T>): History<T> {
  if (history.past.length === 0) return history
  return {
    past: history.past.slice(0, -1),
    present: history.past[history.past.length - 1],
    future: [history.present, ...history.future],
  }
}

export function redo<T>(history: History<T>): History<T> {
  if (history.future.length === 0) return history
  return {
    past: [...history.past, history.present],
    present: history.future[0],
    future: history.future.slice(1),
  }
}

export function canUndo(history: History<unknown>): boolean {
  return history.past.length > 0
}

export function canRedo(history: History<unknown>): boolean {
  return history.future.length > 0
}
