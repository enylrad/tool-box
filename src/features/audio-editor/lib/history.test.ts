import { describe, expect, it } from 'vitest'
import { canRedo, canUndo, createHistory, historyLimitFor, pushHistory, redo, undo } from './history'

describe('history', () => {
  it('undoes and redoes', () => {
    let history = pushHistory(pushHistory(createHistory('a'), 'b'), 'c')
    history = undo(history)
    expect(history.present).toBe('b')
    history = undo(history)
    expect(history.present).toBe('a')
    expect(canUndo(history)).toBe(false)
    history = redo(history)
    expect(history.present).toBe('b')
    expect(canRedo(history)).toBe(true)
  })

  it('clears the redo stack on a new change', () => {
    const history = pushHistory(undo(pushHistory(createHistory(1), 2)), 3)
    expect(history.present).toBe(3)
    expect(canRedo(history)).toBe(false)
    expect(history.past).toEqual([1])
  })

  it('keeps at most `limit` undo steps', () => {
    let history = createHistory(0)
    for (let i = 1; i <= 5; i++) history = pushHistory(history, i, 3)
    expect(history.past).toEqual([2, 3, 4])
  })

  it('fits fewer undo steps for large audio', () => {
    expect(historyLimitFor(1024)).toBe(20)
    expect(historyLimitFor(100 * 1024 * 1024)).toBe(5)
    expect(historyLimitFor(4 * 1024 * 1024 * 1024)).toBe(1)
  })

  it('does nothing when there is nothing to undo or redo', () => {
    const history = createHistory('x')
    expect(undo(history)).toBe(history)
    expect(redo(history)).toBe(history)
  })
})
