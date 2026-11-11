import { useEffect } from 'react'
import L from 'leaflet'
import {
  MapContainer,
  Marker,
  TileLayer,
  useMap,
  useMapEvents,
} from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { cn } from '@/components/ui/utils'
import 'leaflet/dist/leaflet.css'

const DEFAULT_CENTER: [number, number] = [39.6, -8.0]
const DEFAULT_ZOOM = 6
const DETAIL_ZOOM = 12

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

function roundCoordinate(value: number): number {
  return Math.round(value * 100000) / 100000
}

function prefersReducedMotion(): boolean {
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ClickToPick({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void
}) {
  useMapEvents({
    click(event) {
      onPick(
        roundCoordinate(event.latlng.lat),
        roundCoordinate(event.latlng.lng),
      )
    },
  })
  return null
}

function Recenter({ lat, lng }: { lat: number | null; lng: number | null }) {
  const map = useMap()

  useEffect(() => {
    if (lat === null || lng === null) return
    map.setView([lat, lng], map.getZoom(), {
      animate: !prefersReducedMotion(),
    })
  }, [lat, lng, map])

  return null
}

interface MapPickerProps {
  lat: number | null
  lng: number | null
  onPick?: (lat: number, lng: number) => void
  interactive?: boolean
  className?: string
}

export function MapPicker({
  lat,
  lng,
  onPick,
  interactive = onPick !== undefined,
  className,
}: MapPickerProps) {
  const position: [number, number] | null =
    lat !== null && lng !== null ? [lat, lng] : null
  const pick = onPick
  const editable = interactive && pick !== undefined

  return (
    <div className="space-y-2">
      <div
        className={cn(
          'relative isolate z-0 w-full overflow-hidden rounded-xl border',
          className ?? 'h-64 md:h-72',
        )}
      >
        <MapContainer
          center={position ?? DEFAULT_CENTER}
          zoom={position ? DETAIL_ZOOM : DEFAULT_ZOOM}
          scrollWheelZoom={false}
          className="size-full"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {pick && editable && <ClickToPick onPick={pick} />}
          <Recenter lat={lat} lng={lng} />
          {position && (
            <Marker
              position={position}
              icon={pinIcon}
              draggable={editable}
              eventHandlers={
                pick && editable
                  ? {
                      dragend(event) {
                        const marker = event.target as L.Marker
                        const next = marker.getLatLng()
                        pick(
                          roundCoordinate(next.lat),
                          roundCoordinate(next.lng),
                        )
                      },
                    }
                  : undefined
              }
            />
          )}
        </MapContainer>
      </div>
      {editable && (
        <p className="text-sm text-muted-foreground">
          Click the map to place the pin, or drag it to adjust. The map uses
          OpenStreetMap.
        </p>
      )}
    </div>
  )
}

