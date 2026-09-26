import { OUTPUT_FORMATS, type OutputFormatId } from '../lib/formats'

interface OutputSettingsProps {
  formatId: OutputFormatId
  onChange: (formatId: OutputFormatId) => void
}

export function OutputSettings({ formatId, onChange }: OutputSettingsProps) {
  return (
    <fieldset className="grid grid-cols-2 gap-2">
      <legend className="sr-only">Output format</legend>
      {OUTPUT_FORMATS.map((format) => {
        const isSelected = format.id === formatId
        return (
          <label
            key={format.id}
            className={`flex cursor-pointer flex-col rounded-lg border px-3 py-2 transition-colors has-focus-visible:outline-2 has-focus-visible:outline-sky-600 ${
              isSelected
                ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/50'
                : 'border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600'
            }`}
          >
            <input
              type="radio"
              name="output-format"
              value={format.id}
              checked={isSelected}
              onChange={() => onChange(format.id)}
              className="sr-only"
            />
            <span className="text-sm font-semibold">{format.label}</span>
            <span className="text-xs text-slate-500 dark:text-slate-400">{format.description}</span>
          </label>
        )
      })}
    </fieldset>
  )
}
