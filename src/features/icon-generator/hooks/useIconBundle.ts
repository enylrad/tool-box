import { useEffect, useMemo, useState } from 'react'
import { useDebouncedValue } from '../../../hooks/useDebouncedValue'
import { buildIconBundle, type BundleFile } from '../lib/bundle'
import { PLATFORMS } from '../lib/platforms'
import { createRasterizer, type IconSource } from '../lib/render'
import type { IconSettings } from './useIconSettings'

const DEBOUNCE_MS = 250

interface BundleInputs {
  source: IconSource
  svgText: string | null
  settings: IconSettings
}

interface BundleResult {
  inputs: BundleInputs
  files: BundleFile[]
  /** Object URLs of the PNG files, keyed by path. */
  previews: Map<string, string>
  error: string | null
}

export type BundleStatus = 'empty' | 'rendering' | 'ready' | 'error'

/** Renders every icon for the current image and settings (debounced), for preview and export. */
export function useIconBundle(source: IconSource | null, svgText: string | null, settings: IconSettings) {
  const inputs = useMemo<BundleInputs | null>(() => (source ? { source, svgText, settings } : null), [source, svgText, settings])
  const debouncedInputs = useDebouncedValue(inputs, DEBOUNCE_MS)
  const [result, setResult] = useState<BundleResult | null>(null)

  useEffect(() => {
    if (!debouncedInputs) return
    const controller = new AbortController()
    const { source: image, svgText: svg, settings: options } = debouncedInputs

    buildIconBundle(
      {
        platforms: PLATFORMS.filter((platform) => options.platforms[platform]),
        appName: options.appName,
        shortName: options.shortName,
        themeColor: options.themeColor,
        backgroundColor: options.backgroundColor,
        svgText: svg,
        signal: controller.signal,
      },
      createRasterizer(image, options),
    ).then(
      (files) => {
        if (controller.signal.aborted) return
        const previews = new Map(
          files.filter((file) => file.type === 'png').map((file) => [file.path, URL.createObjectURL(new Blob([file.data], { type: 'image/png' }))]),
        )
        setResult({ inputs: debouncedInputs, files, previews, error: null })
      },
      (error: unknown) => {
        if (controller.signal.aborted) return
        console.error('Icon generation failed', error)
        setResult({ inputs: debouncedInputs, files: [], previews: new Map(), error: 'The icons could not be generated from this image.' })
      },
    )

    return () => controller.abort()
  }, [debouncedInputs])

  // Free the preview images once a newer result replaces them.
  useEffect(() => () => result?.previews.forEach((url) => URL.revokeObjectURL(url)), [result])

  let status: BundleStatus
  if (!inputs) status = 'empty'
  else if (result?.inputs !== inputs) status = 'rendering'
  else status = result.error ? 'error' : 'ready'

  const current = inputs && result?.inputs.source === inputs.source ? result : null
  return {
    status,
    files: current?.files ?? [],
    previews: current?.previews ?? new Map<string, string>(),
    error: status === 'error' ? (result?.error ?? null) : null,
  }
}
