import { durationOf, type AudioData } from '../lib/audioData'
import { formatTime } from '../lib/formatTime'
import { OpenFileButton } from './OpenFileButton'

interface EditorHeaderProps {
  fileName: string | null
  audio: AudioData | null
  isModified: boolean
  isLoading: boolean
  onFile: (file: File) => void
}

function describe(audio: AudioData) {
  const channels = audio.channels.length
  return [
    formatTime(durationOf(audio)),
    `${(audio.sampleRate / 1000).toLocaleString('en', { maximumFractionDigits: 2 })} kHz`,
    channels === 1 ? 'mono' : channels === 2 ? 'stereo' : `${channels} channels`,
  ].join(' · ')
}

export function EditorHeader({ fileName, audio, isModified, isLoading, onFile }: EditorHeaderProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-slate-200 bg-white px-4 py-2 dark:border-slate-800 dark:bg-slate-900">
      <div className="min-w-0 flex-1 basis-56">
        <h1 className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{fileName ?? 'Audio Editor & Converter'}</h1>
        <p className="text-xs text-slate-500 dark:text-slate-400" aria-live="polite">
          {isLoading
            ? 'Decoding audio…'
            : audio
              ? `${describe(audio)}${isModified ? ' · edited' : ''}`
              : 'Open an audio file to edit it or convert it to another format'}
        </p>
      </div>
      {audio && <OpenFileButton onFile={onFile} label="Open another file" disabled={isLoading} />}
    </div>
  )
}
