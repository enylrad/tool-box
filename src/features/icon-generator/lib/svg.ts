const DEFAULT_SVG_SIZE = 512

/** Decodes the text of a `data:` URL, whether it is base64 or percent-encoded. */
export function dataUrlToText(dataUrl: string): string {
  const commaIndex = dataUrl.indexOf(',')
  if (!dataUrl.startsWith('data:') || commaIndex === -1) throw new Error('Not a data URL')
  const meta = dataUrl.slice(5, commaIndex)
  const payload = dataUrl.slice(commaIndex + 1)
  if (!meta.endsWith(';base64')) return decodeURIComponent(payload)
  const binary = atob(payload)
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0))
  return new TextDecoder().decode(bytes)
}

export function isSvgDataUrl(dataUrl: string): boolean {
  return dataUrl.startsWith('data:image/svg+xml')
}

function readLength(attributes: string, name: string): number | null {
  const match = new RegExp(`\\s${name}\\s*=\\s*["']\\s*([\\d.]+)\\s*(px)?\\s*["']`).exec(attributes)
  const value = match ? Number(match[1]) : NaN
  return Number.isFinite(value) && value > 0 ? value : null
}

function readViewBox(attributes: string): { width: number; height: number } | null {
  const match = /\sviewBox\s*=\s*["']([^"']*)["']/.exec(attributes)
  if (!match) return null
  const [, , width, height] = match[1].trim().split(/[\s,]+/).map(Number)
  return width > 0 && height > 0 ? { width, height } : null
}

/**
 * Returns the SVG with explicit pixel `width` and `height` on its root
 * element. Browsers cannot reliably draw an SVG without an intrinsic size
 * (e.g. only a viewBox, or percentages) onto a canvas.
 */
export function withIntrinsicSize(svg: string): { svg: string; width: number; height: number } {
  const rootMatch = /<svg\b([^>]*)>/i.exec(svg)
  if (!rootMatch) throw new Error('This file is not an SVG image.')
  const attributes = rootMatch[1]

  const explicitWidth = readLength(attributes, 'width')
  const explicitHeight = readLength(attributes, 'height')
  if (explicitWidth && explicitHeight) return { svg, width: explicitWidth, height: explicitHeight }

  const viewBox = readViewBox(attributes)
  const aspect = viewBox ? viewBox.width / viewBox.height : 1
  let width: number
  let height: number
  if (explicitWidth) {
    width = explicitWidth
    height = explicitWidth / aspect
  } else if (explicitHeight) {
    height = explicitHeight
    width = explicitHeight * aspect
  } else {
    width = viewBox?.width ?? DEFAULT_SVG_SIZE
    height = viewBox?.height ?? DEFAULT_SVG_SIZE
  }

  const selfClosing = /\/\s*$/.test(attributes)
  const cleaned = attributes.replace(/\/\s*$/, '').replace(/\s(width|height)\s*=\s*("[^"]*"|'[^']*')/g, '')
  const newRoot = `<svg${cleaned} width="${width}" height="${height}"${selfClosing ? '/' : ''}>`
  return { svg: svg.slice(0, rootMatch.index) + newRoot + svg.slice(rootMatch.index + rootMatch[0].length), width, height }
}
