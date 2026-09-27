import { FileDropTarget } from '../../components/FileDropTarget'
import { useDocumentTitle } from '../../hooks/useDocumentTitle'
import { ImageWorkspace } from './ImageWorkspace'
import { ImageDropZone } from './components/ImageDropZone'
import { useSourceImage } from './hooks/useSourceImage'

export default function ImageEditorPage() {
  useDocumentTitle('Image Cropper, Resizer & Watermarker')
  const { image, error, isLoading, load, clear } = useSourceImage()
  const openFile = (file: File) => void load(file)

  if (!image) {
    return (
      <div className="flex-1 overflow-auto">
        <div className="mx-auto max-w-2xl space-y-4 px-4 py-10 sm:py-16">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Image Cropper, Resizer & Watermarker</h1>
            <p className="mt-2 text-slate-600 dark:text-slate-400">
              Crop, resize and add a text watermark to an image, compare it before and after, and download it as PNG,
              JPEG or WebP. Everything happens in your browser; the image is never uploaded.
            </p>
          </div>
          <ImageDropZone onFile={openFile} isLoading={isLoading} />
          {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        </div>
      </div>
    )
  }

  return (
    <FileDropTarget onFile={openFile}>
      <ImageWorkspace key={image.url} image={image} error={error} onFile={openFile} onClose={clear} />
    </FileDropTarget>
  )
}
