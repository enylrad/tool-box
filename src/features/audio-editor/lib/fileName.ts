/** Removes the extension from a file name: `song.final.mp3` → `song.final`. */
export function baseName(fileName: string): string {
  const dot = fileName.lastIndexOf('.')
  return dot > 0 ? fileName.slice(0, dot) : fileName
}
