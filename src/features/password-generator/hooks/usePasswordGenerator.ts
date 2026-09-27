import { useCallback, useState } from 'react'
import { generatePassword, type PasswordOptions } from '../lib/generatePassword'

function generateMany(options: PasswordOptions, count: number) {
  return Array.from({ length: count }, () => generatePassword(options))
}

/**
 * Keeps freshly generated passwords in memory only. They are generated again
 * whenever the options or the requested count change.
 */
export function usePasswordGenerator(options: PasswordOptions, count: number) {
  const optionsKey = JSON.stringify([options, count])
  const [state, setState] = useState(() => ({ key: optionsKey, passwords: generateMany(options, count) }))

  let passwords = state.passwords
  if (state.key !== optionsKey) {
    // Adjusting state while rendering avoids showing stale passwords for a frame.
    passwords = generateMany(options, count)
    setState({ key: optionsKey, passwords })
  }

  const regenerate = useCallback(() => {
    setState({ key: optionsKey, passwords: generateMany(options, count) })
    // optionsKey captures every value in options and count.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [optionsKey])

  return { passwords, regenerate }
}
