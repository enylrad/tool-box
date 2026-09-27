import { useEffect, useRef, useState } from 'react'

/** Tracks the content size (in CSS pixels) of the element attached to the returned ref. */
export function useElementSize<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [size, setSize] = useState({ width: 0, height: 0 })

  useEffect(() => {
    const element = ref.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: Math.floor(entry.contentRect.width), height: Math.floor(entry.contentRect.height) }),
    )
    observer.observe(element)
    return () => observer.disconnect()
  }, [])

  return [ref, size] as const
}
