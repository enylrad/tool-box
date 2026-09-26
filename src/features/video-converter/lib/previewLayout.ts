import { outputSize, type Size, type Transform } from './cropGeometry'

export interface PreviewLayout {
  /** Width / height of the output picture; the preview box uses it as its aspect ratio. */
  aspectRatio: number
  /** The cropped area, centred in the box and flipped/rotated with CSS. */
  stage: { width: string; height: string; transform: string }
  /** The full video frame, offset inside the stage so only the crop shows. */
  video: { width: string; height: string; left: string; top: string }
}

const percent = (value: number) => `${value * 100}%`

/**
 * Positions a <video> so the browser shows what the export will look like.
 * CSS applies transforms right to left, so the flip happens before the
 * rotation, exactly like the ffmpeg filter chain.
 */
export function computePreviewLayout(source: Size, transform: Transform): PreviewLayout {
  const crop = transform.crop ?? { x: 0, y: 0, width: source.width, height: source.height }
  const output = outputSize(source, transform)
  const scaleX = transform.flipHorizontal ? -1 : 1
  const scaleY = transform.flipVertical ? -1 : 1

  return {
    aspectRatio: output.width / output.height,
    stage: {
      width: percent(crop.width / output.width),
      height: percent(crop.height / output.height),
      transform: `translate(-50%, -50%) rotate(${transform.rotation}deg) scale(${scaleX}, ${scaleY})`,
    },
    video: {
      width: percent(source.width / crop.width),
      height: percent(source.height / crop.height),
      left: percent(-crop.x / crop.width),
      top: percent(-crop.y / crop.height),
    },
  }
}
