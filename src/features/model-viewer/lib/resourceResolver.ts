/** URLs that already point at data the browser can load by itself. */
const ABSOLUTE_URL = /^(?:data|blob|https?):/i

/** URL returned for a resource that was not dropped, so its request fails instead of hitting the site. */
export const MISSING_RESOURCE_URL = 'about:blank#missing'

/** Reduces a relative resource URL to the lower-case file name it refers to. */
export function normalizeResourcePath(url: string) {
  let path = url.split(/[?#]/)[0].replace(/\\/g, '/')
  try {
    path = decodeURIComponent(path)
  } catch {
    // Keep the raw path if it is not valid percent-encoding.
  }
  const name = path.slice(path.lastIndexOf('/') + 1)
  return name.trim().toLowerCase()
}

/**
 * Maps the relative file names a model references (textures, .bin buffers, .mtl libraries)
 * to object URLs of the files the user dropped next to it. Matching is by file name only,
 * because dropped files carry no folder structure.
 */
export class ResourceResolver {
  private readonly files = new Map<string, File>()
  private readonly urls = new Map<string, string>()
  private readonly missingNames = new Set<string>()
  private readonly createUrl: (file: File) => string
  private readonly revokeUrl: (url: string) => void

  constructor(
    files: readonly File[],
    createUrl: (file: File) => string = (file) => URL.createObjectURL(file),
    revokeUrl: (url: string) => void = (url) => URL.revokeObjectURL(url),
  ) {
    for (const file of files) this.files.set(normalizeResourcePath(file.name), file)
    this.createUrl = createUrl
    this.revokeUrl = revokeUrl
  }

  /** The dropped file a relative URL refers to, if any. */
  findFile(url: string) {
    return this.files.get(normalizeResourcePath(url))
  }

  /** Returns a loadable URL for `url`, recording it as missing when no dropped file matches. */
  resolve = (url: string) => {
    if (ABSOLUTE_URL.test(url)) return url
    const key = normalizeResourcePath(url)
    const file = this.files.get(key)
    if (!file) {
      this.missingNames.add(url.split(/[?#]/)[0].split('/').pop() || url)
      return MISSING_RESOURCE_URL
    }
    let objectUrl = this.urls.get(key)
    if (!objectUrl) {
      objectUrl = this.createUrl(file)
      this.urls.set(key, objectUrl)
    }
    return objectUrl
  }

  /** Records a referenced file as missing without resolving it. */
  markMissing(name: string) {
    this.missingNames.add(name)
  }

  /** File names the model referenced but that were not dropped. */
  get missing() {
    return [...this.missingNames]
  }

  /** Releases every object URL created so far. */
  revokeAll() {
    for (const url of this.urls.values()) this.revokeUrl(url)
    this.urls.clear()
  }
}
