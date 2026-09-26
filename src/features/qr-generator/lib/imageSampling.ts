/**
 * Draws an image centered and scaled to fit ("contain") into a square canvas
 * and returns its RGBA pixels. Browser only.
 */
export function sampleImageContain(image: HTMLImageElement, resolution: number): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = resolution
  canvas.height = resolution
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D is not available')

  const width = image.naturalWidth || resolution
  const height = image.naturalHeight || resolution
  const scale = Math.min(resolution / width, resolution / height)
  const drawWidth = width * scale
  const drawHeight = height * scale
  context.drawImage(image, (resolution - drawWidth) / 2, (resolution - drawHeight) / 2, drawWidth, drawHeight)
  return context.getImageData(0, 0, resolution, resolution).data
}

/** Draws the whole image stretched into a small square, to inspect its own pixels. */
export function sampleImageStretch(image: HTMLImageElement, resolution: number): Uint8ClampedArray {
  const canvas = document.createElement('canvas')
  canvas.width = resolution
  canvas.height = resolution
  const context = canvas.getContext('2d', { willReadFrequently: true })
  if (!context) throw new Error('Canvas 2D is not available')
  context.drawImage(image, 0, 0, resolution, resolution)
  return context.getImageData(0, 0, resolution, resolution).data
}
