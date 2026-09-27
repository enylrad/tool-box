import { useCallback, useRef, useState } from 'react'
import { findClimbs, type Climb } from '../lib/climbs'
import { GpxParseError, parseGpx } from '../lib/parseGpx'
import { computeSplits, type Split } from '../lib/splits'
import { analyzeTrack, type TrackAnalysis } from '../lib/trackAnalysis'

export interface LoadedRoute {
  /** Changes on every load so views can reset their zoom and camera. */
  id: number
  fileName: string
  analysis: TrackAnalysis
  climbs: Climb[]
  splits: Split[]
}

/** GPX files are text; anything much larger than this is almost certainly not one. */
const MAX_FILE_SIZE = 200 * 1024 * 1024

function analyze(id: number, fileName: string, xml: string): LoadedRoute {
  const analysis = analyzeTrack(parseGpx(xml))
  return { id, fileName, analysis, climbs: findClimbs(analysis.points), splits: computeSplits(analysis.points) }
}

/** Loads a GPX file (or text) and analyzes it. The previous route stays visible if a new file fails. */
export function useGpxFile() {
  const [route, setRoute] = useState<LoadedRoute | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const loadIdRef = useRef(0)

  const loadText = useCallback((fileName: string, xml: string) => {
    const id = ++loadIdRef.current
    try {
      setRoute(analyze(id, fileName, xml))
      setError(null)
    } catch (caught) {
      setError(caught instanceof GpxParseError ? caught.message : `Could not read “${fileName}”.`)
    }
  }, [])

  const loadFile = useCallback(
    async (file: File) => {
      if (file.size > MAX_FILE_SIZE) {
        setError(`“${file.name}” is too large to be a GPX file.`)
        return
      }
      setIsLoading(true)
      const id = loadIdRef.current + 1
      try {
        const text = await file.text()
        // Ignore the result if another file was opened meanwhile.
        if (loadIdRef.current + 1 === id) loadText(file.name, text)
      } catch {
        setError(`Could not read “${file.name}”.`)
      } finally {
        setIsLoading(false)
      }
    },
    [loadText],
  )

  return { route, error, isLoading, loadFile, loadText }
}
