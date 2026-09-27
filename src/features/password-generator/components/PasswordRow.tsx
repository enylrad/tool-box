import { Button } from '../../../components/Button'
import { useClipboard } from '../../../hooks/useClipboard'

interface PasswordRowProps {
  password: string
  /** The main password is shown larger. */
  large?: boolean
}

/** A password in a monospace box with its own Copy button. */
export function PasswordRow({ password, large = false }: PasswordRowProps) {
  const { copy, copied, error } = useClipboard()

  return (
    <div>
      <div className="flex items-center gap-2">
        <output
          className={`min-w-0 flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 font-mono break-all text-slate-900 select-all dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100 ${
            large ? 'py-3 text-lg sm:text-xl' : 'py-2 text-sm'
          }`}
        >
          {password}
        </output>
        <Button variant={large ? 'primary' : 'secondary'} onClick={() => copy(password)} aria-live="polite">
          {copied ? 'Copied!' : 'Copy'}
        </Button>
      </div>
      {error && <p className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>}
    </div>
  )
}
