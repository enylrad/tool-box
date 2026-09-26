import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { FileDropZone } from './components/FileDropZone'
import { VideoEditor } from './components/VideoEditor'
import { useFfmpeg } from './hooks/useFfmpeg'
import { useVideoFile } from './hooks/useVideoFile'

export default function VideoConverterPage() {
  useDocumentTitle('Video Editor & Converter')

  // The engine starts loading as soon as the tool opens, while the user picks a file.
  const engine = useFfmpeg()
  const { video, selectFile, reportPreviewMetadata, reportPreviewError } = useVideoFile(engine)

  if (!video) return <FileDropZone onFile={selectFile} />

  return (
    <VideoEditor
      key={video.url}
      video={video}
      engine={engine}
      onOpenFile={selectFile}
      onLoadedMetadata={(element) => reportPreviewMetadata(video.url, element)}
      onPreviewError={() => reportPreviewError(video.url, video.file)}
    />
  )
}
