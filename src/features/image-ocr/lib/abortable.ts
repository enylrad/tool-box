/**
 * Resolves like `promise`, but rejects with the signal's reason as soon as the
 * signal is aborted. The underlying work is not stopped; use this for work that
 * cannot be cancelled (or may never settle once its worker is terminated).
 */
export function abortable<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  if (signal.aborted) return Promise.reject(signal.reason)
  return new Promise<T>((resolve, reject) => {
    const onAbort = () => reject(signal.reason)
    signal.addEventListener('abort', onAbort, { once: true })
    promise.then(resolve, reject).finally(() => signal.removeEventListener('abort', onAbort))
  })
}
