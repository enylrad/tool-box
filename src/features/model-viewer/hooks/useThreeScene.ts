import { useCallback, useState } from 'react'
import { ViewerScene } from '../lib/ViewerScene'

/** Creates a three.js viewer inside the element the returned ref is attached to. */
export function useThreeScene() {
  const [scene, setScene] = useState<ViewerScene | null>(null)
  const [error, setError] = useState<string | null>(null)

  const containerRef = useCallback((element: HTMLDivElement | null) => {
    if (!element) return
    let viewer: ViewerScene
    try {
      viewer = new ViewerScene(element)
    } catch {
      setError('Your browser could not start WebGL, which is needed to display 3D models. Try enabling hardware acceleration.')
      return
    }
    setScene(viewer)
    return () => {
      viewer.dispose()
      setScene(null)
    }
  }, [])

  return { containerRef, scene, error }
}
