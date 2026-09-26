import { describe, expect, it } from 'vitest'
import { abortable } from './abortable'

describe('abortable', () => {
  it('passes through the result when not aborted', async () => {
    await expect(abortable(Promise.resolve(42), new AbortController().signal)).resolves.toBe(42)
  })

  it('rejects when the signal aborts before the promise settles', async () => {
    const controller = new AbortController()
    const pending = abortable(new Promise(() => {}), controller.signal)
    controller.abort(new Error('cancelled'))
    await expect(pending).rejects.toThrow('cancelled')
  })

  it('rejects immediately when the signal is already aborted', async () => {
    const controller = new AbortController()
    controller.abort(new Error('cancelled'))
    await expect(abortable(Promise.resolve(1), controller.signal)).rejects.toThrow('cancelled')
  })
})
