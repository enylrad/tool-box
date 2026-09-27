import { LockIcon } from './Icons'

/** Always-visible reminder that the photo never leaves the device. */
export function PrivacyBadge() {
  return (
    <p
      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-800 ring-1 ring-emerald-600/20 ring-inset dark:bg-emerald-950 dark:text-emerald-300 dark:ring-emerald-400/30"
      title="The photo is read with JavaScript in this tab's memory. No request is made to any server, and it keeps working offline."
    >
      <LockIcon className="size-3.5" />
      Processed on your device · nothing is uploaded
    </p>
  )
}
