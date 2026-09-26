import type { ReactNode } from 'react'
import { Button } from '../../../components/Button'
import { formatBytes } from '../lib/formatTime'
import {
  getOutputFormat,
  OUTPUT_FORMATS,
  resolveBitrateKbps,
  resolveChannelCount,
  resolveSampleRate,
  SAMPLE_RATE_OPTIONS,
  type ChannelOption,
  type ExportSettings,
  type OutputFormatId,
  type WavBitDepth,
} from '../lib/outputFormats'
import type { ExportResult } from '../hooks/useAudioExport'

interface ExportPanelProps {
  settings: ExportSettings
  onSettingsChange: (settings: ExportSettings) => void
  availableFormats: Record<OutputFormatId, boolean> | null
  sourceSampleRate: number
  sourceChannels: number
  isExporting: boolean
  progress: number
  error: string | null
  lastExport: ExportResult | null
  onExport: () => void
}

const SELECT_CLASS =
  'rounded-md border border-slate-300 bg-white px-2 py-1.5 text-sm disabled:opacity-60 dark:border-slate-600 dark:bg-slate-800'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-slate-500 dark:text-slate-400">
      {label}
      {children}
    </label>
  )
}

function channelLabel(count: number) {
  return count === 1 ? 'mono' : count === 2 ? 'stereo' : `${count} channels`
}

function formatRate(hz: number) {
  return `${(hz / 1000).toLocaleString('en', { maximumFractionDigits: 2 })} kHz`
}

export function ExportPanel({
  settings,
  onSettingsChange,
  availableFormats,
  sourceSampleRate,
  sourceChannels,
  isExporting,
  progress,
  error,
  lastExport,
  onExport,
}: ExportPanelProps) {
  const format = getOutputFormat(settings.formatId)
  const isAvailable = availableFormats?.[format.id] ?? format.encoder !== 'webcodecs'
  const bitrate = resolveBitrateKbps(format, settings.bitrateKbps)
  const outputRate = resolveSampleRate(format, settings.sampleRate, sourceSampleRate)
  const outputChannels = resolveChannelCount(format, settings.channels, sourceChannels)
  const update = (patch: Partial<ExportSettings>) => onSettingsChange({ ...settings, ...patch })

  const selectFormat = (formatId: OutputFormatId) => {
    const next = getOutputFormat(formatId)
    update({ formatId, bitrateKbps: resolveBitrateKbps(next, settings.bitrateKbps) ?? settings.bitrateKbps })
  }

  const summary = [
    format.label,
    bitrate ? `${bitrate} kbps` : format.id === 'wav' ? `${settings.wavBitDepth}-bit` : 'lossless',
    formatRate(outputRate),
    channelLabel(outputChannels),
  ].join(' · ')

  return (
    <section aria-labelledby="export-heading" className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <h2 id="export-heading" className="text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">
        Export / convert
      </h2>

      <div role="radiogroup" aria-label="Output format" className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6">
        {OUTPUT_FORMATS.map((option) => {
          const available = availableFormats?.[option.id] ?? option.encoder !== 'webcodecs'
          const selected = option.id === settings.formatId
          return (
            <button
              key={option.id}
              type="button"
              role="radio"
              aria-checked={selected}
              disabled={!available || isExporting}
              title={available ? option.description : 'Not supported by this browser'}
              onClick={() => selectFormat(option.id)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
                selected
                  ? 'border-sky-500 bg-sky-50 text-sky-800 ring-1 ring-sky-500 dark:bg-sky-950 dark:text-sky-200'
                  : 'border-slate-300 hover:border-sky-400 dark:border-slate-700 dark:hover:border-sky-500'
              }`}
            >
              <span className="block font-semibold">{option.label}</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">
                {available ? (option.lossless ? 'Lossless' : 'Compressed') : 'Unsupported here'}
              </span>
            </button>
          )
        })}
      </div>
      <p className="text-sm text-slate-600 dark:text-slate-300">{format.description}</p>

      <div className="flex flex-wrap items-end gap-4">
        {!format.lossless && (
          <Field label="Bitrate">
            <select
              className={SELECT_CLASS}
              value={bitrate ?? ''}
              disabled={isExporting}
              onChange={(event) => update({ bitrateKbps: Number(event.target.value) })}
            >
              {format.bitratesKbps.map((kbps) => (
                <option key={kbps} value={kbps}>
                  {kbps} kbps
                </option>
              ))}
            </select>
          </Field>
        )}
        {format.id === 'wav' && (
          <Field label="Bit depth">
            <select
              className={SELECT_CLASS}
              value={settings.wavBitDepth}
              disabled={isExporting}
              onChange={(event) => update({ wavBitDepth: Number(event.target.value) as WavBitDepth })}
            >
              <option value={16}>16-bit (CD)</option>
              <option value={24}>24-bit</option>
              <option value={32}>32-bit float</option>
            </select>
          </Field>
        )}
        <Field label="Sample rate">
          <select
            className={SELECT_CLASS}
            value={settings.sampleRate ?? ''}
            disabled={isExporting}
            onChange={(event) => update({ sampleRate: event.target.value ? Number(event.target.value) : null })}
          >
            {SAMPLE_RATE_OPTIONS.map((rate) => (
              <option key={rate ?? 'original'} value={rate ?? ''}>
                {rate ? formatRate(rate) : `Original (${formatRate(sourceSampleRate)})`}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Channels">
          <select
            className={SELECT_CLASS}
            value={String(settings.channels)}
            disabled={isExporting}
            onChange={(event) =>
              update({ channels: (event.target.value === 'original' ? 'original' : Number(event.target.value)) as ChannelOption })
            }
          >
            <option value="original">Original ({channelLabel(sourceChannels)})</option>
            <option value="1">Mono</option>
            <option value="2">Stereo</option>
          </select>
        </Field>
        <Button variant="primary" onClick={onExport} disabled={!isAvailable || isExporting} aria-busy={isExporting} className="min-w-36">
          {isExporting ? `Exporting… ${Math.round(progress * 100)}%` : `Export ${format.label.split(' ')[0]}`}
        </Button>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400">Output: {summary}</p>
      {isExporting && (
        <div className="h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-slate-700" role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progress * 100)}>
          <div className="h-full bg-sky-600 transition-[width]" style={{ width: `${progress * 100}%` }} />
        </div>
      )}
      {error && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {error}
        </p>
      )}
      {lastExport && !isExporting && (
        <p className="text-sm text-emerald-700 dark:text-emerald-400" aria-live="polite">
          Downloaded {lastExport.fileName} ({formatBytes(lastExport.size)})
        </p>
      )}
    </section>
  )
}
