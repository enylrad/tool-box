import { useCallback, useRef, useState } from 'react'
import type { AudioData } from '../lib/audioData'
import {
  canRedo,
  canUndo,
  createHistory,
  historyLimitFor,
  pushHistory,
  redo as redoHistory,
  undo as undoHistory,
  type History,
} from '../lib/history'

interface LoadedAudio {
  /** Changes every time a file is opened. */
  id: number
  fileName: string
  original: AudioData
  history: History<AudioData>
}

function snapshotBytes(audio: AudioData): number {
  return audio.channels.reduce((total, samples) => total + samples.byteLength, 0)
}

/** The audio being edited: loading/decoding a file, applying edits, and undo/redo. */
export function useAudioDocument() {
  const [loaded, setLoaded] = useState<LoadedAudio | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Ignore a slow decode that finishes after a newer file was chosen.
  const loadIdRef = useRef(0)

  const loadFile = useCallback(async (file: File) => {
    const loadId = ++loadIdRef.current
    setIsLoading(true)
    setError(null)
    try {
      const { decodeAudioFile } = await import('../lib/decode')
      const audio = await decodeAudioFile(file)
      if (loadId !== loadIdRef.current) return
      setLoaded({ id: loadId, fileName: file.name, original: audio, history: createHistory(audio) })
    } catch (cause) {
      if (loadId !== loadIdRef.current) return
      console.error('Could not decode audio', cause)
      setError(`Could not open “${file.name}”. The file may be damaged or in a format this browser cannot decode.`)
    } finally {
      if (loadId === loadIdRef.current) setIsLoading(false)
    }
  }, [])

  const applyEdit = useCallback((edit: (audio: AudioData) => AudioData) => {
    setLoaded((current) => {
      if (!current) return current
      const next = edit(current.history.present)
      if (next === current.history.present) return current
      return { ...current, history: pushHistory(current.history, next, historyLimitFor(snapshotBytes(next))) }
    })
  }, [])

  const undo = useCallback(() => {
    setLoaded((current) => current && { ...current, history: undoHistory(current.history) })
  }, [])

  const redo = useCallback(() => {
    setLoaded((current) => current && { ...current, history: redoHistory(current.history) })
  }, [])

  /** Goes back to the decoded file. This is itself undoable. */
  const revert = useCallback(() => {
    setLoaded((current) => {
      if (!current || current.history.present === current.original) return current
      return { ...current, history: pushHistory(current.history, current.original, historyLimitFor(snapshotBytes(current.original))) }
    })
  }, [])

  return {
    documentId: loaded?.id ?? null,
    fileName: loaded?.fileName ?? null,
    audio: loaded?.history.present ?? null,
    isModified: loaded ? loaded.history.present !== loaded.original : false,
    canUndo: loaded ? canUndo(loaded.history) : false,
    canRedo: loaded ? canRedo(loaded.history) : false,
    isLoading,
    error,
    loadFile,
    applyEdit,
    undo,
    redo,
    revert,
  }
}
