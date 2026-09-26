export interface ShapePreset {
  id: string
  name: string
  dataUrl: string
}

function svgDataUrl(body: string): string {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="400" height="400">${body}</svg>`
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`
}

/** Built-in silhouettes, so the feature can be tried without an image. */
export const SHAPE_PRESETS: ShapePreset[] = [
  {
    id: 'heart',
    name: 'Heart',
    dataUrl: svgDataUrl('<path d="M50 92C22 70 3 53 3 31 3 15 15 4 29 4c9 0 16 5 21 12C55 9 62 4 71 4c14 0 26 11 26 27 0 22-19 39-47 61z"/>'),
  },
  { id: 'circle', name: 'Circle', dataUrl: svgDataUrl('<circle cx="50" cy="50" r="49"/>') },
  {
    id: 'star',
    name: 'Star',
    dataUrl: svgDataUrl('<path d="M50 1l14.7 31.8 34.8 4.1-25.7 23.8 6.8 34.4L50 77.8 19.4 95.1l6.8-34.4L.5 36.9l34.8-4.1z"/>'),
  },
  { id: 'hexagon', name: 'Hexagon', dataUrl: svgDataUrl('<path d="M50 1l43 24.5v49L50 99 7 74.5v-49z"/>') },
]
