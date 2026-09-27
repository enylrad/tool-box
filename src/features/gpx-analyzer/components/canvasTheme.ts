/** Colors for the canvas views, matching the Tailwind slate palette used by the rest of the site. */
export interface CanvasTheme {
  grid: string
  text: string
  mutedText: string
  trackOutline: string
  profileLine: string
  climbBand: string
  hover: string
  labelBackground: string
}

const LIGHT: CanvasTheme = {
  grid: 'rgba(148, 163, 184, 0.3)',
  text: '#334155',
  mutedText: '#64748b',
  trackOutline: '#ffffff',
  profileLine: '#1e293b',
  climbBand: 'rgba(239, 68, 68, 0.08)',
  hover: '#0f172a',
  labelBackground: 'rgba(255, 255, 255, 0.9)',
}

const DARK: CanvasTheme = {
  grid: 'rgba(100, 116, 139, 0.3)',
  text: '#cbd5e1',
  mutedText: '#94a3b8',
  trackOutline: '#020617',
  profileLine: '#f1f5f9',
  climbBand: 'rgba(248, 113, 113, 0.12)',
  hover: '#f8fafc',
  labelBackground: 'rgba(15, 23, 42, 0.9)',
}

export function canvasTheme(isDark: boolean): CanvasTheme {
  return isDark ? DARK : LIGHT
}

export const START_COLOR = '#16a34a'
export const END_COLOR = '#dc2626'

/** Sizes a canvas for the device pixel ratio and returns a context that draws in CSS pixels. */
export function prepareCanvas(canvas: HTMLCanvasElement, width: number, height: number): CanvasRenderingContext2D | null {
  const pixelRatio = window.devicePixelRatio || 1
  canvas.width = Math.max(1, Math.floor(width * pixelRatio))
  canvas.height = Math.max(1, Math.floor(height * pixelRatio))
  const context = canvas.getContext('2d')
  if (!context) return null
  context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
  context.clearRect(0, 0, width, height)
  return context
}

/** Draws a small rounded label with a background so it stays readable over the track. */
export function drawLabel(context: CanvasRenderingContext2D, text: string, x: number, y: number, theme: CanvasTheme, align: CanvasTextAlign = 'left') {
  context.font = '600 11px ui-sans-serif, system-ui, sans-serif'
  const width = context.measureText(text).width + 8
  const left = align === 'center' ? x - width / 2 : align === 'right' ? x - width : x
  context.fillStyle = theme.labelBackground
  context.beginPath()
  context.roundRect(left, y - 9, width, 18, 4)
  context.fill()
  context.fillStyle = theme.text
  context.textAlign = 'left'
  context.textBaseline = 'middle'
  context.fillText(text, left + 4, y)
}
