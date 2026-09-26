import { useMemo } from 'react'
import type { QrCodeResult } from '../hooks/useQrCode'

interface QrPreviewProps {
  result: QrCodeResult
  transparentBackground: boolean
}

// A checkerboard behind transparent codes, like image editors show.
const CHECKERBOARD_CLASS =
  'bg-[conic-gradient(#e2e8f0_25%,#ffffff_0_50%,#e2e8f0_0_75%,#ffffff_0)] bg-[length:20px_20px]'

export function QrPreview({ result, transparentBackground }: QrPreviewProps) {
  // Rendering through <img> shows exactly the exported file and never runs scripts.
  const imageSrc = useMemo(
    () => (result.status === 'ready' ? `data:image/svg+xml;charset=utf-8,${encodeURIComponent(result.svg)}` : null),
    [result],
  )

  return (
    <div className="space-y-2">
      <div
        className={`flex aspect-square w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 p-4 dark:border-slate-800 ${
          transparentBackground ? CHECKERBOARD_CLASS : 'bg-white'
        }`}
      >
        {imageSrc ? (
          <img src={imageSrc} alt="QR code preview" className="size-full object-contain" />
        ) : (
          <p className={`px-6 text-center text-sm ${result.status === 'error' ? 'text-red-600' : 'text-slate-500'}`} role={result.status === 'error' ? 'alert' : undefined}>
            {result.status === 'error' ? result.message : 'Fill in the content to generate a QR code.'}
          </p>
        )}
      </div>
      {result.status === 'ready' && (
        <p className="text-center text-xs text-slate-500 dark:text-slate-400">
          Version {result.version} · {result.moduleCount}×{result.moduleCount} modules · Error correction {result.errorCorrection}
        </p>
      )}
    </div>
  )
}
