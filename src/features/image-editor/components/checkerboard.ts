import type { CSSProperties } from 'react'

/** Grey checkerboard shown behind images so transparent areas are visible. */
export const CHECKERBOARD_STYLE: CSSProperties = {
  backgroundColor: '#ffffff',
  backgroundImage: 'conic-gradient(#e2e8f0 25%, transparent 0 50%, #e2e8f0 0 75%, transparent 0)',
  backgroundSize: '16px 16px',
}
