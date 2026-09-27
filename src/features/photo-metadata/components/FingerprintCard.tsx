import { Button } from '../../../components/Button'
import { Panel } from '../../../components/Panel'
import { useClipboard } from '../../../hooks/useClipboard'
import { describeFormat, type ImageFormat } from '../lib/detectFormat'
import { WarningIcon } from './Icons'

interface FingerprintCardProps {
  sha256: string | null
  format: ImageFormat | null
  fileName: string
  warning: string | null
}

export function FingerprintCard({ sha256, format, fileName, warning }: FingerprintCardProps) {
  const { copy, copied } = useClipboard()
  return (
    <Panel title="File fingerprint" description="Identifies this exact file: any change, even to the metadata, changes the hash.">
      <dl className="space-y-3 text-sm">
        <div>
          <dt className="text-slate-500 dark:text-slate-400">Real format (from the file's first bytes)</dt>
          <dd className="mt-0.5">{format ? describeFormat(format, fileName) : 'Not recognized'}</dd>
        </div>
        {sha256 && (
          <div>
            <dt className="text-slate-500 dark:text-slate-400">SHA-256</dt>
            <dd className="mt-0.5 flex flex-wrap items-center gap-2">
              <code className="min-w-0 font-mono text-xs break-all">{sha256}</code>
              <Button variant="ghost" onClick={() => copy(sha256)}>
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </dd>
          </div>
        )}
      </dl>
      {warning && (
        <p className="flex gap-2 rounded-md bg-amber-50 p-3 text-sm text-amber-900 dark:bg-amber-950 dark:text-amber-200">
          <WarningIcon className="mt-0.5" />
          {warning}
        </p>
      )}
    </Panel>
  )
}
