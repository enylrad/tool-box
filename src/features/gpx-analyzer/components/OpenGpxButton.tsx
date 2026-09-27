import { useRef, type ChangeEvent } from 'react'
import { Button } from '../../../components/Button'

export const ACCEPTED_FILE_TYPES = '.gpx,application/gpx+xml,application/xml,text/xml'

interface OpenGpxButtonProps {
  onFile: (file: File) => void
  label?: string
  variant?: 'primary' | 'secondary'
}

export function OpenGpxButton({ onFile, label = 'Open GPX', variant = 'secondary' }: OpenGpxButtonProps) {
  const inputRef = useRef<HTMLInputElement>(null)

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    // Reset so choosing the same file again still triggers a change.
    event.target.value = ''
    if (file) onFile(file)
  }

  return (
    <>
      <Button variant={variant} onClick={() => inputRef.current?.click()}>
        {label}
      </Button>
      <input ref={inputRef} type="file" accept={ACCEPTED_FILE_TYPES} className="hidden" onChange={handleChange} />
    </>
  )
}
