/** Renders an SVG string to a square PNG of `sizePx` pixels, locally in the browser. */
export async function svgToPngBlob(svg: string, sizePx: number): Promise<Blob> {
  const image = new Image()
  image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
  await image.decode()

  const canvas = document.createElement('canvas')
  canvas.width = sizePx
  canvas.height = sizePx
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas 2D is not available')
  context.drawImage(image, 0, 0, sizePx, sizePx)

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG encoding failed'))), 'image/png')
  })
}
