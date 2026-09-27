import { Button } from '../../../components/Button'
import { Panel } from '../../../components/Panel'
import { useClipboard } from '../../../hooks/useClipboard'
import {
  formatAltitude,
  formatCoordinates,
  formatDirection,
  googleMapsUrl,
  openStreetMapUrl,
  toDms,
  type GpsLocation,
} from '../lib/gps'
import { presentRows } from '../lib/infoRows'
import { ExternalLinkIcon } from './Icons'
import { InfoList } from './InfoCard'

const linkClass =
  'inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium ring-1 ring-inset ring-slate-300 hover:bg-slate-50 dark:ring-slate-600 dark:hover:bg-slate-800'

export function LocationCard({ location }: { location: GpsLocation | null }) {
  const { copy, copied } = useClipboard()

  if (!location) {
    return (
      <Panel title="Location (GPS)">
        <p className="text-sm text-slate-500 dark:text-slate-400">This photo has no GPS coordinates.</p>
      </Panel>
    )
  }

  const rows = presentRows([
    { label: 'Latitude', value: location.latitude.toFixed(6), hint: toDms(location.latitude, 'lat'), mono: true },
    { label: 'Longitude', value: location.longitude.toFixed(6), hint: toDms(location.longitude, 'lon'), mono: true },
    { label: 'Altitude', value: location.altitude !== undefined ? formatAltitude(location.altitude) : undefined },
    {
      label: 'Camera direction',
      value: location.direction !== undefined ? formatDirection(location.direction) : undefined,
      hint: location.directionRef,
    },
    { label: 'Accuracy', value: location.accuracy !== undefined ? `± ${Math.round(location.accuracy)} m` : undefined },
    { label: 'Speed', value: location.speed },
    { label: 'GPS time', value: location.timestamp },
  ])

  return (
    <Panel title="Location (GPS)" description="Where the device was when the photo was taken.">
      <InfoList rows={rows} />
      <div className="flex flex-wrap gap-2">
        <a href={googleMapsUrl(location)} target="_blank" rel="noopener noreferrer" className={linkClass}>
          Open in Google Maps
          <ExternalLinkIcon className="size-3.5" />
        </a>
        <a href={openStreetMapUrl(location)} target="_blank" rel="noopener noreferrer" className={linkClass}>
          OpenStreetMap
          <ExternalLinkIcon className="size-3.5" />
        </a>
        <Button onClick={() => copy(formatCoordinates(location))}>{copied ? 'Copied!' : 'Copy coordinates'}</Button>
      </div>
      <p className="text-xs text-slate-500 dark:text-slate-400">
        The map links open an external website and send it these coordinates. Nothing is sent unless you click them.
      </p>
    </Panel>
  )
}
