import { FileDrop } from '../../../components/form/FileDrop'
import { Slider } from '../../../components/form/Slider'
import type { LoadedImage } from '../../../hooks/useImageFile'
import { ImagePreviewRow } from './ImagePreviewRow'

interface LogoPanelProps {
  logo: LoadedImage | null
  error: string | null
  logoSize: number
  onFile: (file: File) => void
  onRemove: () => void
  onSizeChange: (size: number) => void
}

export function LogoPanel({ logo, error, logoSize, onFile, onRemove, onSizeChange }: LogoPanelProps) {
  return (
    <>
      {logo ? (
        <>
          <ImagePreviewRow src={logo.dataUrl} name={logo.fileName} onRemove={onRemove} />
          <Slider
            label="Logo size"
            value={Math.round(logoSize * 100)}
            min={10}
            max={30}
            onChange={(percent) => onSizeChange(percent / 100)}
            formatValue={(value) => `${value}%`}
            hint="Bigger logos are more visible but harder to scan. Test the code before printing."
          />
        </>
      ) : (
        <FileDrop label="Add a logo" hint="PNG, SVG, JPG or WebP · stays on your device" onFile={onFile} />
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </>
  )
}
