import { zipSync, type Zippable } from 'fflate'
import type { BundleFile } from './bundle'

/** Packs the bundle into a .zip. Images are stored as-is: PNG data is already compressed. */
export function zipBundle(files: readonly BundleFile[]): Uint8Array<ArrayBuffer> {
  const entries: Zippable = {}
  for (const file of files) {
    entries[file.path] = [file.data, { level: file.type === 'png' || file.type === 'ico' ? 0 : 6 }]
  }
  return zipSync(entries) as Uint8Array<ArrayBuffer>
}
