import { useEffect, useState } from 'react'
import type { LoadedModel } from '../lib/loadModel'
import type { ViewerScene } from '../lib/ViewerScene'

interface AnimationSelection {
  model: LoadedModel | null
  clipIndex: number
  isPlaying: boolean
}

/** Chooses and plays one of the model's animation clips. Resets to the first clip for every new model. */
export function useModelAnimations(scene: ViewerScene | null, model: LoadedModel | null) {
  const [selection, setSelection] = useState<AnimationSelection>({ model, clipIndex: 0, isPlaying: true })
  const current = selection.model === model ? selection : { model, clipIndex: 0, isPlaying: true }
  const hasClips = (model?.animations.length ?? 0) > 0

  useEffect(() => {
    scene?.setAnimation(hasClips ? current.clipIndex : null, current.isPlaying)
  }, [scene, model, hasClips, current.clipIndex, current.isPlaying])

  return {
    clipIndex: current.clipIndex,
    isPlaying: current.isPlaying,
    selectClip: (clipIndex: number) => setSelection({ model, clipIndex, isPlaying: true }),
    setPlaying: (isPlaying: boolean) => setSelection({ ...current, isPlaying }),
  }
}
