import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { AudioWorkspace } from './AudioWorkspace'
import { EditorHeader } from './components/EditorHeader'
import { EmptyState } from './components/EmptyState'
import { FileDropTarget } from './components/FileDropTarget'
import { useAudioDocument } from './hooks/useAudioDocument'

export default function AudioEditorPage() {
  useDocumentTitle('Audio Editor & Converter')

  const audioDocument = useAudioDocument()
  const handleFile = (file: File) => void audioDocument.loadFile(file)

  return (
    <FileDropTarget onFile={handleFile}>
      <EditorHeader
        fileName={audioDocument.fileName}
        audio={audioDocument.audio}
        isModified={audioDocument.isModified}
        isLoading={audioDocument.isLoading}
        onFile={handleFile}
      />
      {audioDocument.error && (
        <p role="alert" className="bg-red-50 px-4 py-2 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">
          {audioDocument.error}
        </p>
      )}
      {audioDocument.audio && audioDocument.fileName ? (
        <AudioWorkspace
          key={audioDocument.documentId}
          fileName={audioDocument.fileName}
          audio={audioDocument.audio}
          isModified={audioDocument.isModified}
          canUndo={audioDocument.canUndo}
          canRedo={audioDocument.canRedo}
          onApplyEdit={audioDocument.applyEdit}
          onUndo={audioDocument.undo}
          onRedo={audioDocument.redo}
          onRevert={audioDocument.revert}
        />
      ) : (
        <EmptyState isLoading={audioDocument.isLoading} onFile={handleFile} />
      )}
    </FileDropTarget>
  )
}
