import { useCallback, useEffect, useRef, useState } from 'react'

const COPIED_RESET_MS = 2000

function copyWithTextarea(text: string) {
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.setAttribute('readonly', '')
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  const succeeded = document.execCommand('copy')
  textarea.remove()
  if (!succeeded) throw new Error('Copy command was rejected')
}

/** Copies text to the clipboard; `copied` stays true for a moment afterwards. */
export function useClipboard() {
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const resetTimeoutRef = useRef<number | undefined>(undefined)

  useEffect(() => () => window.clearTimeout(resetTimeoutRef.current), [])

  const copy = useCallback(async (text: string) => {
    setError(null)
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text)
      } else {
        copyWithTextarea(text)
      }
      setCopied(true)
      window.clearTimeout(resetTimeoutRef.current)
      resetTimeoutRef.current = window.setTimeout(() => setCopied(false), COPIED_RESET_MS)
    } catch {
      setError('Could not copy to the clipboard.')
    }
  }, [])

  return { copy, copied, error }
}
