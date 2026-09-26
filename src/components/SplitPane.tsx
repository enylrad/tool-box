import { useState, type ReactNode } from 'react'

export type SplitPaneSide = 'left' | 'right'

interface SplitPaneProps {
  left: ReactNode
  right: ReactNode
  leftLabel: string
  rightLabel: string
  /** Visible pane on small screens. Omit both to let the component manage it. */
  activePane?: SplitPaneSide
  onActivePaneChange?: (pane: SplitPaneSide) => void
}

/**
 * Two panes side by side on medium screens and up. On small screens only one
 * pane is visible at a time and tabs switch between them.
 */
export function SplitPane({ left, right, leftLabel, rightLabel, activePane: controlledPane, onActivePaneChange }: SplitPaneProps) {
  const [uncontrolledPane, setUncontrolledPane] = useState<SplitPaneSide>('left')
  const activePane = controlledPane ?? uncontrolledPane
  const setActivePane = onActivePaneChange ?? setUncontrolledPane

  const tabClass = (pane: SplitPaneSide) =>
    `flex-1 py-2 text-sm font-medium border-b-2 transition-colors ${
      activePane === pane
        ? 'border-sky-600 text-sky-700 dark:text-sky-400'
        : 'border-transparent text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
    }`

  const paneClass = (pane: SplitPaneSide) => `min-h-0 min-w-0 ${activePane === pane ? 'flex' : 'hidden'} flex-col md:flex`

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div role="tablist" className="flex border-b border-slate-200 bg-white md:hidden dark:border-slate-800 dark:bg-slate-900">
        <button type="button" role="tab" aria-selected={activePane === 'left'} className={tabClass('left')} onClick={() => setActivePane('left')}>
          {leftLabel}
        </button>
        <button type="button" role="tab" aria-selected={activePane === 'right'} className={tabClass('right')} onClick={() => setActivePane('right')}>
          {rightLabel}
        </button>
      </div>
      <div className="grid min-h-0 flex-1 grid-cols-1 md:grid-cols-2 md:divide-x md:divide-slate-200 dark:md:divide-slate-800">
        <section aria-label={leftLabel} className={paneClass('left')}>
          {left}
        </section>
        <section aria-label={rightLabel} className={paneClass('right')}>
          {right}
        </section>
      </div>
    </div>
  )
}
