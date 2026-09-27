import { useLocalStorage } from '../../../hooks/useLocalStorage'
import { DEFAULT_PASSWORD_OPTIONS, MAX_LENGTH, MIN_LENGTH, type PasswordOptions } from '../lib/generatePassword'

const OPTIONS_STORAGE_KEY = 'tool-box:password-generator:options'

/** The generator settings, saved in localStorage. Passwords themselves are never stored. */
export function usePasswordOptions() {
  const [storedOptions, setOptions] = useLocalStorage<Partial<PasswordOptions>>(
    OPTIONS_STORAGE_KEY,
    DEFAULT_PASSWORD_OPTIONS,
  )

  // Stored settings may come from an older version or have been edited by hand.
  const merged = { ...DEFAULT_PASSWORD_OPTIONS, ...storedOptions }
  const options: PasswordOptions = {
    ...merged,
    length: Math.min(MAX_LENGTH, Math.max(MIN_LENGTH, Math.round(Number(merged.length) || DEFAULT_PASSWORD_OPTIONS.length))),
  }
  if (!options.lowercase && !options.uppercase && !options.digits && !options.symbols) options.lowercase = true

  const updateOptions = (changes: Partial<PasswordOptions>) => setOptions({ ...options, ...changes })

  return { options, updateOptions }
}
