import { useCallback, useState } from 'react'
import { centeredCrop, type CropRect, type Size } from '../../../lib/cropGeometry'
import { IDENTITY_TRANSFORM, rotate, type Transform } from '../lib/cropGeometry'
import { DEFAULT_FORMAT_ID, type OutputFormatId } from '../lib/formats'
import { clampTrim, type TrimRange } from '../lib/timecode'

export interface AspectPreset {
  id: string
  label: string
  /** Width / height, or `null` for a free-form crop. */
  ratio: number | null
}

export const ASPECT_PRESETS: AspectPreset[] = [
  { id: 'free', label: 'Free', ratio: null },
  { id: '16:9', label: '16:9', ratio: 16 / 9 },
  { id: '9:16', label: '9:16', ratio: 9 / 16 },
  { id: '1:1', label: '1:1', ratio: 1 },
  { id: '4:3', label: '4:3', ratio: 4 / 3 },
]

/** Starting crop: the preset's largest centred area, or 80% of the frame when free. */
function initialCrop(frame: Size, ratio: number | null): CropRect {
  if (ratio !== null) return centeredCrop(frame, ratio)
  const inset = { x: Math.round(frame.width * 0.1), y: Math.round(frame.height * 0.1) }
  return { ...inset, width: frame.width - inset.x * 2, height: frame.height - inset.y * 2 }
}

/** Everything the user chooses for the export: trim, transform and output format. */
export function useEditSettings(duration: number | null) {
  const [trim, setTrimState] = useState<TrimRange>({ start: 0, end: null })
  const [transform, setTransform] = useState<Transform>(IDENTITY_TRANSFORM)
  const [aspectPresetId, setAspectPresetId] = useState('free')
  const [isEditingCrop, setIsEditingCrop] = useState(false)
  const [formatId, setFormatId] = useState<OutputFormatId>(DEFAULT_FORMAT_ID)

  const aspectRatio = ASPECT_PRESETS.find((preset) => preset.id === aspectPresetId)?.ratio ?? null

  const setTrim = useCallback(
    (range: TrimRange) => setTrimState(clampTrim(range, duration ?? Number.NaN)),
    [duration],
  )

  const rotateBy = useCallback((degrees: 90 | -90) => {
    setTransform((previous) => ({ ...previous, rotation: rotate(previous.rotation, degrees) }))
  }, [])

  const toggleFlip = useCallback((axis: 'horizontal' | 'vertical') => {
    setTransform((previous) =>
      axis === 'horizontal'
        ? { ...previous, flipHorizontal: !previous.flipHorizontal }
        : { ...previous, flipVertical: !previous.flipVertical },
    )
  }, [])

  const setCrop = useCallback((crop: CropRect | null) => {
    setTransform((previous) => ({ ...previous, crop }))
  }, [])

  const startCrop = useCallback(
    (frame: Size) => {
      setCrop(initialCrop(frame, aspectRatio))
      setIsEditingCrop(true)
    },
    [aspectRatio, setCrop],
  )

  const removeCrop = useCallback(() => {
    setCrop(null)
    setIsEditingCrop(false)
  }, [setCrop])

  const chooseAspectPreset = useCallback(
    (presetId: string, frame: Size) => {
      setAspectPresetId(presetId)
      const ratio = ASPECT_PRESETS.find((preset) => preset.id === presetId)?.ratio ?? null
      if (ratio !== null) setCrop(centeredCrop(frame, ratio))
      setIsEditingCrop(true)
    },
    [setCrop],
  )

  const resetTransform = useCallback(() => {
    setTransform(IDENTITY_TRANSFORM)
    setIsEditingCrop(false)
  }, [])

  return {
    trim,
    setTrim,
    transform,
    rotateBy,
    toggleFlip,
    setCrop,
    startCrop,
    removeCrop,
    resetTransform,
    isEditingCrop,
    setIsEditingCrop,
    aspectPresetId,
    aspectRatio,
    chooseAspectPreset,
    formatId,
    setFormatId,
  }
}
