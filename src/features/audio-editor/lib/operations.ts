import { durationOf, frameCount, targetRange, toFrameRange, type AudioData, type TimeRange } from './audioData'
import { applyGain, deleteRange, fadeIn, fadeOut, normalize, reverse, silence, toMono, trim } from './edits'

export type EditOperation =
  | { type: 'trim' }
  | { type: 'delete' }
  | { type: 'silence' }
  | { type: 'fadeIn' }
  | { type: 'fadeOut' }
  | { type: 'gain'; db: number }
  | { type: 'normalize' }
  | { type: 'reverse' }
  | { type: 'mono' }

/** True when `selection` covers at least one frame. */
export function hasSelection(audio: AudioData, selection: TimeRange | null): selection is TimeRange {
  if (!selection) return false
  const range = toFrameRange(audio, selection)
  return range.end > range.start
}

/** True when the selection can be deleted without leaving the audio empty. */
export function canDeleteSelection(audio: AudioData, selection: TimeRange | null): boolean {
  if (!hasSelection(audio, selection)) return false
  const range = toFrameRange(audio, selection)
  return range.end - range.start < frameCount(audio)
}

/**
 * Applies an edit to the selection, or to the whole audio when nothing is
 * selected. Trim and delete need a selection; without one (or when delete would
 * remove everything) the audio is returned unchanged.
 */
export function applyOperation(audio: AudioData, selection: TimeRange | null, operation: EditOperation): AudioData {
  const range = targetRange(audio, selection)
  switch (operation.type) {
    case 'trim':
      return hasSelection(audio, selection) ? trim(audio, range) : audio
    case 'delete':
      return canDeleteSelection(audio, selection) ? deleteRange(audio, range) : audio
    case 'silence':
      return silence(audio, range)
    case 'fadeIn':
      return fadeIn(audio, range)
    case 'fadeOut':
      return fadeOut(audio, range)
    case 'gain':
      return applyGain(audio, range, operation.db)
    case 'normalize':
      return normalize(audio, range)
    case 'reverse':
      return reverse(audio, range)
    case 'mono':
      return toMono(audio)
  }
}

export interface EditorCursor {
  selection: TimeRange | null
  position: number
}

/** Where the selection and playhead go after an edit that changes the timeline. */
export function cursorAfter(operation: EditOperation, before: EditorCursor, result: AudioData): EditorCursor {
  const clampToResult = (seconds: number) => Math.min(Math.max(0, seconds), durationOf(result))
  switch (operation.type) {
    case 'trim':
      return { selection: null, position: 0 }
    case 'delete':
      return { selection: null, position: clampToResult(Math.min(before.selection?.start ?? 0, before.selection?.end ?? 0)) }
    default:
      return { selection: before.selection, position: clampToResult(before.position) }
  }
}
