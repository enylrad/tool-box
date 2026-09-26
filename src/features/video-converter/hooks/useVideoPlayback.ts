import { useCallback, useEffect, useState } from 'react'
import type { TrimRange } from '../lib/timecode'

/** Moves the playhead. A plain function because the element is a hook argument. */
function setVideoTime(video: HTMLVideoElement, time: number) {
  video.currentTime = time
}

/**
 * Play/pause and seeking for the preview. Playback stays inside the trimmed
 * range so the user hears and sees exactly what will be exported.
 */
export function useVideoPlayback(video: HTMLVideoElement | null, trim: TrimRange) {
  const [currentTime, setCurrentTime] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    if (!video) return
    let frameId = 0

    const tick = () => {
      if (trim.end !== null && video.currentTime >= trim.end) {
        video.pause()
        setVideoTime(video, trim.end)
      }
      setCurrentTime(video.currentTime)
      if (!video.paused) frameId = requestAnimationFrame(tick)
    }
    const handlePlay = () => {
      setIsPlaying(true)
      frameId = requestAnimationFrame(tick)
    }
    const handlePause = () => {
      setIsPlaying(false)
      cancelAnimationFrame(frameId)
      setCurrentTime(video.currentTime)
    }
    const handleSeeked = () => setCurrentTime(video.currentTime)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('seeked', handleSeeked)
    return () => {
      cancelAnimationFrame(frameId)
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('seeked', handleSeeked)
    }
  }, [video, trim.end])

  const seek = useCallback(
    (time: number) => {
      if (!video) return
      setVideoTime(video, time)
      setCurrentTime(time)
    },
    [video],
  )

  const togglePlay = useCallback(() => {
    if (!video) return
    if (!video.paused) {
      video.pause()
      return
    }
    const end = trim.end ?? video.duration
    // Start from the beginning of the clip when outside it or at its end.
    if (video.currentTime < trim.start || video.currentTime >= end - 0.05) setVideoTime(video, trim.start)
    void video.play().catch(() => setIsPlaying(false))
  }, [video, trim.start, trim.end])

  return { currentTime, isPlaying, togglePlay, seek }
}
