const MAX_FILE_NAME_LENGTH = 80

/** Triggers a browser download for an in-memory blob. */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  link.rel = 'noopener'
  document.body.appendChild(link)
  link.click()
  link.remove()
  // Revoke on the next tick so the browser has started the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 0)
}

/** Turns an arbitrary title into a safe, readable file name. */
export function toFileName(title: string, extension: string, fallback = 'document') {
  const slug = title
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, MAX_FILE_NAME_LENGTH)
    .replace(/-+$/g, '')
  return `${slug || fallback}.${extension}`
}
