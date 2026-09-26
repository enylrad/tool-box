import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { durationOf, toAudioBuffer, type AudioData } from '../lib/audioData'

interface ActivePlayback {
  source: AudioBufferSourceNode
  /** `AudioContext.currentTime` that corresponds to position 0 of the audio. */
  origin: number
  /** Where the playhead goes when playback ends on its own. */
  returnTo: number
}

/**
 * Plays the audio being edited and tracks the playhead position (in seconds).
 * Playback stops whenever the audio changes because of an edit.
 */
export function useAudioPlayback(audio: AudioData | null) {
  const [position, setPosition] = useState(0)
  // The buffer being played; comparing it with the current one means an edit stops playback.
  const [playingBuffer, setPlayingBuffer] = useState<AudioBuffer | null>(null)
  const contextRef = useRef<AudioContext | null>(null)
  const activeRef = useRef<ActivePlayback | null>(null)
  const frameRef = useRef(0)

  // Converting to an AudioBuffer copies every sample, so do it once per edit.
  const buffer = useMemo(() => (audio ? toAudioBuffer(audio) : null), [audio])
  const duration = audio ? durationOf(audio) : 0

  /** Stops the audio output. Does not touch React state, so it is safe in effect cleanups. */
  const stopSource = useCallback(() => {
    const active = activeRef.current
    activeRef.current = null
    window.cancelAnimationFrame(frameRef.current)
    if (active) {
      active.source.onended = null
      active.source.stop()
      active.source.disconnect()
    }
  }, [])

  const halt = useCallback(() => {
    stopSource()
    setPlayingBuffer(null)
  }, [stopSource])

  /** Plays from `from` until `to` (or the end). */
  const play = useCallback(
    async (from: number, to?: number) => {
      if (!buffer) return
      halt()
      const context = contextRef.current ?? new AudioContext()
      contextRef.current = context
      if (context.state === 'suspended') await context.resume()

      const start = Math.min(Math.max(0, from), buffer.duration)
      const end = Math.min(to ?? buffer.duration, buffer.duration)
      const source = context.createBufferSource()
      source.buffer = buffer
      source.connect(context.destination)
      const active: ActivePlayback = {
        source,
        origin: context.currentTime - start,
        // A selection is replayable from its start; playing to the end rewinds.
        returnTo: to === undefined ? 0 : start,
      }
      activeRef.current = active
      source.onended = () => {
        if (activeRef.current !== active) return
        halt()
        setPosition(active.returnTo)
      }
      source.start(0, start, Math.max(0, end - start))
      setPlayingBuffer(buffer)
      setPosition(start)

      const tick = () => {
        if (activeRef.current !== active) return
        setPosition(Math.min(end, context.currentTime - active.origin))
        frameRef.current = window.requestAnimationFrame(tick)
      }
      frameRef.current = window.requestAnimationFrame(tick)
    },
    [buffer, halt],
  )

  /** Stops playback and keeps the playhead where it is. */
  const pause = useCallback(() => {
    const active = activeRef.current
    const context = contextRef.current
    if (active && context) setPosition(context.currentTime - active.origin)
    halt()
  }, [halt])

  const seek = useCallback(
    (seconds: number) => {
      halt()
      setPosition(Math.min(Math.max(0, seconds), duration))
    },
    [halt, duration],
  )

  // An edit replaces the buffer: silence the old one.
  useEffect(() => stopSource, [buffer, stopSource])

  useEffect(
    () => () => {
      void contextRef.current?.close()
      contextRef.current = null
    },
    [],
  )

  return {
    // After an edit the audio may be shorter than the last playhead position.
    position: Math.min(position, duration),
    isPlaying: playingBuffer !== null && playingBuffer === buffer,
    duration,
    play,
    pause,
    seek,
  }
}
