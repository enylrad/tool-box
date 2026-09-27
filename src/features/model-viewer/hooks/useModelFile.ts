import { useCallback, useEffect, useRef, useState } from 'react'
import { disposeObject } from '../lib/disposeObject'
import { loadModel, type LoadedModel } from '../lib/loadModel'

interface ModelFileState {
  model: LoadedModel | null
  error: string | null
  isLoading: boolean
}

/** Loads dropped files as a 3D model, keeping only the result of the latest request. */
export function useModelFile() {
  const [state, setState] = useState<ModelFileState>({ model: null, error: null, isLoading: false })
  const requestIdRef = useRef(0)

  const loadFiles = useCallback(async (files: readonly File[]) => {
    if (files.length === 0) return
    const requestId = ++requestIdRef.current
    setState((previous) => ({ ...previous, error: null, isLoading: true }))
    try {
      const model = await loadModel(files)
      if (requestId !== requestIdRef.current) {
        disposeObject(model.object)
        model.revokeUrls()
        return
      }
      setState({ model, error: null, isLoading: false })
    } catch (error) {
      if (requestId !== requestIdRef.current) return
      setState((previous) => ({ ...previous, error: error instanceof Error ? error.message : String(error), isLoading: false }))
    }
  }, [])

  // Blob URLs of a model's textures are released once it is replaced or the page is left.
  const { model } = state
  useEffect(() => () => model?.revokeUrls(), [model])

  // Ignore loads that finish after the page is left.
  useEffect(() => () => void requestIdRef.current++, [])

  return { ...state, loadFiles }
}
