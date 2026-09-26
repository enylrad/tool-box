import { useRef, type ChangeEvent } from 'react'
import { Button } from '../../../components/Button'

export const ACCEPTED_FILE_TYPES = 'audio/*,video/*,.mp3,.wav,.flac,.ogg,.oga,.opus,.m4a,.aac,.webm,.mp4,.mov,.mkv'

interface OpenFileButtonProps {
  onFile: (file: File) => void
  label?: string
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export function OpenFileButton({ onFile, label = 'Open file', variant = 'secondary', disabled }: OpenFileButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again still triggers a change.
    event.target.value = ''
    if (file) onFile(file)
  }

  return (
    <>
      <Button variant={variant} onClick={() => inputRef.current?.click()} disabled={disabled}>
        {label}
      </Button>
      <input ref={inputRef} type="file" accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={handleChange} />
    </>
  )
}
