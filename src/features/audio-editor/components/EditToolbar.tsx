import { useState, type ReactNode } from 'react'
import { Button } from '../../../components/Button'
import type { EditOperation } from '../lib/operations'

interface EditToolbarProps {
  hasSelection: boolean
  canDeleteSelection: boolean
  isMono: boolean
  canUndo: boolean
  canRedo: boolean
  isModified: boolean
  onEdit: (operation: EditOperation) => void
  onUndo: () => void
  onRedo: () => void
  onRevert: () => void
}

function Group({ title, children }: { title: string; children: ReactNode }) {
  return (
    <fieldset className="flex flex-wrap items-center gap-2">
      <legend className="mb-1.5 text-xs font-medium tracking-wide text-slate-500 uppercase dark:text-slate-400">{title}</legend>
      {children}
    </fieldset>
  )
}

export function EditToolbar({
  hasSelection,
  canDeleteSelection,
  isMono,
  canUndo,
  canRedo,
  isModified,
  onEdit,
  onUndo,
  onRedo,
  onRevert,
}: EditToolbarProps) {
  const [gainDb, setGainDb] = useState(3)
  const isGainValid = Number.isFinite(gainDb) && gainDb !== 0 && Math.abs(gainDb) <= 60

  return (
    <section aria-label="Edit" className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
      <p className="text-xs text-slate-500 dark:text-slate-400">
        {hasSelection
          ? 'Effects apply to the selected range.'
          : 'Effects apply to the whole file. Drag on the waveform to select a range.'}
      </p>
      <div className="flex flex-wrap gap-x-8 gap-y-4">
        <Group title="Cut">
          <Button onClick={() => onEdit({ type: 'trim' })} disabled={!hasSelection} title="Keep only the selection">
            Trim to selection
          </Button>
          <Button onClick={() => onEdit({ type: 'delete' })} disabled={!canDeleteSelection} title="Delete the selection (Del)">
            Delete selection
          </Button>
        </Group>

        <Group title="Volume">
          <Button onClick={() => onEdit({ type: 'fadeIn' })}>Fade in</Button>
          <Button onClick={() => onEdit({ type: 'fadeOut' })}>Fade out</Button>
          <Button onClick={() => onEdit({ type: 'normalize' })} title="Raise the volume so the loudest peak reaches −1 dB">
            Normalize
          </Button>
          <Button onClick={() => onEdit({ type: 'silence' })}>Silence</Button>
          <span className="flex items-center gap-1">
            <label className="sr-only" htmlFor="gain-db">
              Gain in decibels
            </label>
            <input
              id="gain-db"
              type="number"
              step={1}
              min={-60}
              max={60}
              value={Number.isFinite(gainDb) ? gainDb : ''}
              onChange={(event) => setGainDb(event.target.valueAsNumber)}
              className="w-16 rounded-md border border-slate-300 bg-white px-2 py-1 text-sm tabular-nums dark:border-slate-600 dark:bg-slate-800"
            />
            <span className="text-sm text-slate-500 dark:text-slate-400">dB</span>
            <Button onClick={() => onEdit({ type: 'gain', db: gainDb })} disabled={!isGainValid}>
              Apply gain
            </Button>
          </span>
        </Group>

        <Group title="Other">
          <Button onClick={() => onEdit({ type: 'reverse' })}>Reverse</Button>
          <Button onClick={() => onEdit({ type: 'mono' })} disabled={isMono} title="Mix all channels into one (whole file)">
            Convert to mono
          </Button>
        </Group>

        <Group title="History">
          <Button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
            Undo
          </Button>
          <Button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Shift+Z)">
            Redo
          </Button>
          <Button variant="ghost" onClick={onRevert} disabled={!isModified} title="Go back to the original file">
            Revert to original
          </Button>
        </Group>
      </div>
    </section>
  )
}
