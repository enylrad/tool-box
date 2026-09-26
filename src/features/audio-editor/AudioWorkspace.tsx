import { useState } from 'react'
import { EditToolbar } from './components/EditToolbar'
import { ExportPanel } from './components/ExportPanel'
import { TransportBar } from './components/TransportBar'
import { Waveform } from './components/Waveform'
import { useAudioExport } from './hooks/useAudioExport'
import { useAudioPlayback } from './hooks/useAudioPlayback'
import { useEditorShortcuts } from './hooks/useEditorShortcuts'
import { useExportSettings } from './hooks/useExportSettings'
import { clamp, durationOf, type AudioData, type TimeRange } from './lib/audioData'
import { applyOperation, canDeleteSelection, cursorAfter, hasSelection, type EditOperation } from './lib/operations'

interface AudioWorkspaceProps {
  fileName: string
  audio: AudioData
  isModified: boolean
  canUndo: boolean
  canRedo: boolean
  onApplyEdit: (edit: (audio: AudioData) => AudioData) => void
  onUndo: () => void
  onRedo: () => void
  onRevert: () => void
}

/**
 * Editing screen for one opened file. It is keyed by the opened file, so the
 * selection and playhead start fresh whenever another file is opened.
 */
export function AudioWorkspace({
  fileName,
  audio,
  isModified,
  canUndo,
  canRedo,
  onApplyEdit,
  onUndo,
  onRedo,
  onRevert,
}: AudioWorkspaceProps) {
  const [rawSelection, setRawSelection] = useState<TimeRange | null>(null)
  const { position, isPlaying, duration, play, pause, seek } = useAudioPlayback(audio)
  const [exportSettings, setExportSettings] = useExportSettings()
  const { availableFormats, exportAudio, isExporting, progress, error, lastExport } = useAudioExport()

  // Undo/redo can shorten the audio; keep the selection inside it.
  const selection = hasSelection(audio, rawSelection)
    ? { start: clamp(rawSelection.start, 0, duration), end: clamp(rawSelection.end, 0, duration) }
    : null

  const changeSelection = (next: TimeRange | null) => {
    if (!next) return setRawSelection(null)
    const start = clamp(Math.min(next.start, next.end), 0, duration)
    const end = clamp(Math.max(next.start, next.end), 0, duration)
    setRawSelection(end > start ? { start, end } : null)
  }

  const handleEdit = (operation: EditOperation) => {
    const result = applyOperation(audio, selection, operation)
    if (result === audio) return
    const cursor = cursorAfter(operation, { selection, position }, result)
    onApplyEdit(() => result)
    setRawSelection(cursor.selection)
    seek(Math.min(cursor.position, durationOf(result)))
  }

  const handlePlay = () => {
    if (selection) void play(selection.start, selection.end)
    else void play(position >= duration ? 0 : position)
  }

  const togglePlay = () => (isPlaying ? pause() : handlePlay())

  useEditorShortcuts({
    onTogglePlay: togglePlay,
    onUndo,
    onRedo,
    onDelete: () => handleEdit({ type: 'delete' }),
    onClearSelection: () => setRawSelection(null),
  })

  return (
    <div className="flex-1 overflow-auto">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 p-3 sm:p-4">
        <Waveform audio={audio} selection={selection} position={position} onSelectionChange={changeSelection} onSeek={seek} />
        <TransportBar
          position={position}
          duration={duration}
          isPlaying={isPlaying}
          selection={selection}
          onPlay={handlePlay}
          onPause={pause}
          onStop={() => seek(0)}
          onSelectionChange={changeSelection}
        />
        <EditToolbar
          hasSelection={selection !== null}
          canDeleteSelection={canDeleteSelection(audio, selection)}
          isMono={audio.channels.length === 1}
          canUndo={canUndo}
          canRedo={canRedo}
          isModified={isModified}
          onEdit={handleEdit}
          onUndo={onUndo}
          onRedo={onRedo}
          onRevert={onRevert}
        />
        <ExportPanel
          settings={exportSettings}
          onSettingsChange={setExportSettings}
          availableFormats={availableFormats}
          sourceSampleRate={audio.sampleRate}
          sourceChannels={audio.channels.length}
          isExporting={isExporting}
          progress={progress}
          error={error}
          lastExport={lastExport}
          onExport={() => void exportAudio(audio, exportSettings, fileName)}
        />
      </div>
    </div>
  )
}
