import type { Strength } from '../lib/strength'

const LEVEL_COLORS = ['bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-lime-500', 'bg-emerald-500'] as const

interface StrengthMeterProps {
  strength: Strength
  entropyBits: number
}

export function StrengthMeter({ strength, entropyBits }: StrengthMeterProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1" aria-hidden="true">
        {LEVEL_COLORS.map((color, level) => (
          <div
            key={color}
            className={`h-1.5 flex-1 rounded-full ${level <= strength.level ? color : 'bg-slate-200 dark:bg-slate-700'}`}
          />
        ))}
      </div>
      <p className="flex justify-between text-xs text-slate-600 dark:text-slate-400">
        <span>
          Strength: <strong className="font-semibold text-slate-900 dark:text-slate-100">{strength.label}</strong>
        </span>
        <span className="tabular-nums">~{Math.floor(entropyBits)} bits of entropy</span>
      </p>
    </div>
  )
}
