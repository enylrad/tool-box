import { useCallback, useEffect, useRef, useState, type SetStateAction } from 'react'

export type PersistStatus = 'saved' | 'pending' | 'error'

interface UseLocalStorageOptions {
  /** Delay before writing to storage after the last change. */
  debounceMs?: number
}

function readStoredValue<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    // Storage can be unavailable (private mode, blocked cookies) or corrupted.
    return fallback
  }
}

/**
 * useState that is persisted to localStorage.
 *
 * Writes are debounced so that fast typing does not serialize on every
 * keystroke; any pending write is flushed when the page is hidden or the
 * component unmounts.
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  { debounceMs = 300 }: UseLocalStorageOptions = {},
) {
  const [value, setValue] = useState<T>(() => readStoredValue(key, initialValue))
  const [status, setStatus] = useState<PersistStatus>('saved')
  const latestValueRef = useRef(value)
  const isDirtyRef = useRef(false)

  useEffect(() => {
    latestValueRef.current = value
  }, [value])

  const flush = useCallback(() => {
    if (!isDirtyRef.current) return
    isDirtyRef.current = false
    try {
      window.localStorage.setItem(key, JSON.stringify(latestValueRef.current))
      setStatus('saved')
    } catch {
      setStatus('error')
    }
  }, [key])

  useEffect(() => {
    if (!isDirtyRef.current) return
    const timeoutId = window.setTimeout(flush, debounceMs)
    return () => window.clearTimeout(timeoutId)
  }, [value, debounceMs, flush])

  useEffect(() => {
    window.addEventListener('pagehide', flush)
    return () => {
      window.removeEventListener('pagehide', flush)
      flush()
    }
  }, [flush])

  const updateValue = useCallback((next: SetStateAction<T>) => {
    isDirtyRef.current = true
    setStatus('pending')
    setValue(next)
  }, [])

  return [value, updateValue, status] as const
}
