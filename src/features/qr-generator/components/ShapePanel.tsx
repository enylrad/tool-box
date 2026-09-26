import { Button } from '../../../components/Button'
import { FileDrop } from '../../../components/form/FileDrop'
import { Slider } from '../../../components/form/Slider'
import { Toggle } from '../../../components/form/Toggle'
import type { LoadedImage } from '../../../hooks/useImageFile'
import type { QrStyleSettings } from '../hooks/useQrStyle'
import { SHAPE_PRESETS, type ShapePreset } from '../lib/shapePresets'
import { ImagePreviewRow } from './ImagePreviewRow'

interface ShapePanelProps {
  shapeImage: LoadedImage | null
  error: string | null
  style: QrStyleSettings
  onFile: (file: File) => void
  onPreset: (preset: ShapePreset) => void
  onRemove: () => void
  onChange: (patch: Partial<QrStyleSettings>) => void
}

export function ShapePanel({ shapeImage, error, style, onFile, onPreset, onRemove, onChange }: ShapePanelProps) {
  return (
    <>
      {shapeImage ? (
        <>
          <ImagePreviewRow src={shapeImage.dataUrl} name={shapeImage.fileName} onRemove={onRemove} />
          <Slider
            label="Shape size"
            value={style.shapeScale}
            min={1.5}
            max={3}
            step={0.1}
            onChange={(shapeScale) => onChange({ shapeScale })}
            formatValue={(value) => `${value.toFixed(1)}× the code`}
          />
          <Slider
            label="Fill density"
            value={Math.round(style.shapeDensity * 100)}
            min={30}
            max={80}
            step={5}
            onChange={(percent) => onChange({ shapeDensity: percent / 100 })}
            formatValue={(value) => `${value}%`}
          />
          <Toggle label="Invert shape" checked={style.shapeInvert} onChange={(shapeInvert) => onChange({ shapeInvert })} />
        </>
      ) : (
        <>
          <FileDrop
            label="Choose a silhouette image"
            hint="Best with a transparent PNG/SVG or a dark shape on a white background"
            onFile={onFile}
          />
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-sm text-slate-500 dark:text-slate-400">Or try:</span>
            {SHAPE_PRESETS.map((preset) => (
              <Button key={preset.id} onClick={() => onPreset(preset)}>
                <img src={preset.dataUrl} alt="" className="size-4 dark:invert" />
                {preset.name}
              </Button>
            ))}
          </div>
        </>
      )}
      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
    </>
  )
}
