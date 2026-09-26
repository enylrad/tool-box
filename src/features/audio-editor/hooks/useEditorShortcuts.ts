import { useEffect, useRef } from 'react'

interface EditorShortcuts {
  onTogglePlay: () => void
  onUndo: () => void
  onRedo: () => void
  onDelete: () => void
  onClearSelection: () => void
}

function isEditableTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (target.isContentEditable || /^(INPUT|TEXTAREA|SELECT|BUTTON)$/.test(target.tagName))
}

/** Space: play/pause · Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y: undo/redo · Delete: delete selection · Esc: clear selection. */
export function useEditorShortcuts(shortcuts: EditorShortcuts) {
  // Keep the latest handlers without re-registering the listener on every render.
  const shortcutsRef = useRef(shortcuts)
  useEffect(() => {
    shortcutsRef.current = shortcuts
  })

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.defaultPrevented || isEditableTarget(event.target)) return
      const handlers = shortcutsRef.current
      const key = event.key.toLowerCase()
      const withModifier = event.ctrlKey || event.metaKey

      if (withModifier && key === 'z') handlers[event.shiftKey ? 'onRedo' : 'onUndo']()
      else if (withModifier && key === 'y') handlers.onRedo()
      else if (withModifier || event.altKey) return
      else if (key === ' ') handlers.onTogglePlay()
      else if (key === 'delete' || key === 'backspace') handlers.onDelete()
      else if (key === 'escape') handlers.onClearSelection()
      else return
      event.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])
}
