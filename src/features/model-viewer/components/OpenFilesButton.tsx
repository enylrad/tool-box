import { useRef, type ChangeEvent } from 'react'
import { Button } from '../../../components/Button'
import { ACCEPTED_FILE_TYPES } from '../lib/classifyFiles'

interface OpenFilesButtonProps {
  onFiles: (files: File[]) => void
  label?: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

/** Opens the file picker; several files can be chosen so a model's textures come along with it. */
export function OpenFilesButton({ onFiles, label = 'Open model', variant = 'secondary', disabled }: OpenFilesButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    // Reset so choosing the same files again still triggers a change.
    event.target.value = ''
    if (files.length > 0) onFiles(files)
  }

  return (
    <>
      <Button variant={variant} onClick={() => inputRef.current?.click()} disabled={disabled}>
        {label}
      </Button>
      <input ref={inputRef} type="file" multiple accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={handleChange} />
    </>
  )
}
