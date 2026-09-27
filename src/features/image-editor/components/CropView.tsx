import { CropOverlay } from '../../../components/CropOverlay'
import { useElementSize } from '../../../hooks/useElementSize'
import type { CropRect } from '../../../lib/cropGeometry'
import type { SourceImage } from '../hooks/useSourceImage'
import { fitInside } from '../lib/resize'
import { CHECKERBOARD_STYLE } from './checkerboard'

interface CropViewProps {
  image: SourceImage
  crop: CropRect
  aspectRatio: number | null
  onChange: (crop: CropRect) => void
}

/** The whole original image, fitted to the available space, with a draggable crop box. */
export function CropView({ image, crop, aspectRatio, onChange }: CropViewProps) {
  const [containerRef, box] = useElementSize<HTMLDivElement>()
  // Leave room for the crop handles, which overhang the image edges.
  const display = fitInside(image, { width: box.width - 16, height: box.height - 16 })

  return (
    <div ref={containerRef} className="flex min-h-0 flex-1 items-center justify-center">
      {display.width > 0 && (
        <div className="relative shadow-sm" style={{ ...CHECKERBOARD_STYLE, width: display.width, height: display.height }}>
          <img src={image.url} alt="Original" draggable={false} className="block size-full select-none" />
          <CropOverlay frame={image} crop={crop} aspectRatio={aspectRatio} onChange={onChange} />
        </div>
      )}
    </div>
  )
}
