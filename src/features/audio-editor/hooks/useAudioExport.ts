import { useCallback, useEffect, useRef, useState } from 'react'
import { downloadBlob, toFileName } from '../../../lib/download'
import type { AudioData } from '../lib/audioData'
import { baseName } from '../lib/fileName'
import { getOutputFormat, type ExportSettings, type OutputFormatId } from '../lib/outputFormats'

export interface ExportResult {
  fileName: string
  size: number
}

/**
 * Encodes the edited audio and downloads it. Mediabunny and the WebAssembly
 * encoders are loaded on demand because they are large.
 */
export function useAudioExport() {
  const [availableFormats, setAvailableFormats] = useState<Record<OutputFormatId, boolean> | null>(null)
  const [isExporting, setIsExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [lastExport, setLastExport] = useState<ExportResult | null>(null)
  const isRunningRef = useRef(false)

  useEffect(() => {
    let isCurrent = true
    import('../lib/encode')
      .then(({ detectAvailableFormats }) => detectAvailableFormats())
      .then((formats) => isCurrent && setAvailableFormats(formats))
      .catch((cause) => console.error('Could not detect supported formats', cause))
    return () => {
      isCurrent = false
    }
  }, [])

  const exportAudio = useCallback(async (audio: AudioData, settings: ExportSettings, sourceFileName: string) => {
    if (isRunningRef.current) return
    isRunningRef.current = true
    setIsExporting(true)
    setProgress(0)
    setError(null)
    setLastExport(null)

    try {
      const { encodeAudio } = await import('../lib/encode')
      const blob = await encodeAudio(audio, settings, setProgress)
      const fileName = toFileName(baseName(sourceFileName), getOutputFormat(settings.formatId).extension, 'audio')
      downloadBlob(blob, fileName)
      setLastExport({ fileName, size: blob.size })
    } catch (cause) {
      console.error('Audio export failed', cause)
      setError('Could not export the audio. Try another format or different settings.')
    } finally {
      isRunningRef.current = false
      setIsExporting(false)
    }
  }, [])

  return { availableFormats, exportAudio, isExporting, progress, error, lastExport }
}
