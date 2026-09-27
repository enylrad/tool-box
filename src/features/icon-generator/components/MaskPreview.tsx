const MASK_CLASSES = {
  circle: 'rounded-full',
  squircle: 'rounded-[32%]',
  ios: 'rounded-[22.5%]',
} as const

interface MaskPreviewProps {
  src: string
  label: string
  mask: keyof typeof MASK_CLASSES
  /** Background layer color, for icons whose PNG is only the foreground. */
  background?: string
  /** How much of the image is outside the visible area (Android adaptive layers are 108 dp, 72 dp visible). */
  zoom?: number
}

/** Shows an icon through the mask a platform applies, so clipped areas are visible. */
export function MaskPreview({ src, label, mask, background, zoom = 1 }: MaskPreviewProps) {
  return (
    <figure className="flex flex-col items-center gap-1">
      <div className={`relative size-16 overflow-hidden shadow ${MASK_CLASSES[mask]}`} style={{ backgroundColor: background }}>
        <img
          src={src}
          alt=""
          className="absolute top-1/2 left-1/2 max-w-none -translate-x-1/2 -translate-y-1/2"
          style={{ width: `${zoom * 100}%`, height: `${zoom * 100}%` }}
        />
      </div>
      <figcaption className="text-xs text-slate-500 dark:text-slate-400">{label}</figcaption>
    </figure>
  )
}
