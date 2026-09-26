import type { KeyboardEvent } from 'react'

interface MarkdownEditorProps {
  value: string
  onChange: (value: string) => void
}

const INDENT = '  '

export function MarkdownEditor({ value, onChange }: MarkdownEditorProps) {
  // Insert spaces on Tab instead of moving focus, like a code editor.
  // Shift+Tab keeps the default behavior so keyboard users can still leave the field.
  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key !== 'Tab' || event.shiftKey) return
    event.preventDefault()
    const textarea = event.currentTarget
    const { selectionStart, selectionEnd } = textarea
    onChange(value.slice(0, selectionStart) + INDENT + value.slice(selectionEnd))
    requestAnimationFrame(() => {
      textarea.selectionStart = textarea.selectionEnd = selectionStart + INDENT.length
    })
  }

  return (
    <textarea
      aria-label="Markdown source"
      className="h-full w-full resize-none bg-white p-4 font-mono text-sm leading-relaxed text-slate-900 outline-none dark:bg-slate-950 dark:text-slate-100"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={handleKeyDown}
      spellCheck={false}
      autoCapitalize="off"
      autoComplete="off"
      autoCorrect="off"
      placeholder="Write your Markdown here…"
    />
  )
}
