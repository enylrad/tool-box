import { useRef, useState, type DragEvent, type ReactNode } from 'react'

interface FileDropTargetProps {
  onFile: (file: File) => void
  children: ReactNode
}

function hasFiles(event: DragEvent) {
  return Array.from(event.dataTransfer.types).includes('Files')
}

/** Lets a file be dropped anywhere inside `children`, with a visual overlay while dragging. */
export function FileDropTarget({ onFile, children }: FileDropTargetProps) {
  const [isDragging, setIsDragging] = useState(false)
  // dragenter/dragleave fire for every child element; count them to know when the pointer really left.
  const depthRef = useRef(0)

  const handleDragEnter = (event: DragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    depthRef.current++
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    depthRef.current = Math.max(0, depthRef.current - 1)
    if (depthRef.current === 0) setIsDragging(false)
  }

  const handleDragOver = (event: DragEvent) => {
    if (!hasFiles(event)) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const handleDrop = (event: DragEvent) => {
    event.preventDefault()
    depthRef.current = 0
    setIsDragging(false)
    const file = event.dataTransfer.files[0]
    if (file) onFile(file)
  }

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col"
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      {children}
      {isDragging && (
        <div className="pointer-events-none absolute inset-2 z-10 flex items-center justify-center rounded-xl border-2 border-dashed border-sky-500 bg-sky-50/90 text-lg font-medium text-sky-700 dark:bg-sky-950/90 dark:text-sky-300">
          Drop the file to open it
        </div>
      )}
    </div>
  )
}
