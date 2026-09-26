import { useMemo } from 'react'
import { sampleImageContain, sampleImageStretch } from '../lib/imageSampling'
import { buildShapeMask, hasTransparency, type ShapeMask } from '../lib/shapeMask'

const MASK_RESOLUTION = 256
const TRANSPARENCY_PROBE_RESOLUTION = 64

/**
 * Turns an image into a silhouette mask. Transparent images use their opaque
 * pixels as the shape; opaque images use their dark pixels.
 */
export function useShapeMask(image: HTMLImageElement | null, invert: boolean): ShapeMask | null {
  return useMemo(() => {
    if (!image) return null
    const mode = hasTransparency(sampleImageStretch(image, TRANSPARENCY_PROBE_RESOLUTION)) ? 'alpha' : 'luminance'
    return buildShapeMask(sampleImageContain(image, MASK_RESOLUTION), MASK_RESOLUTION, { mode, invert })
  }, [image, invert])
}
