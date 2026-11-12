import L from 'leaflet'
import { MapContainer, Marker, TileLayer } from 'react-leaflet'
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import 'leaflet/dist/leaflet.css'

const pinIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

interface ProducerMapProps {
  lat: number
  lng: number
  name: string
}

export function ProducerMap({ lat, lng, name }: ProducerMapProps) {
  const position: [number, number] = [lat, lng]

  return (
    <div className="frame-thick w-100 overflow-hidden position-relative producer-public-map">
      <MapContainer
        center={position}
        zoom={12}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Marker position={position} icon={pinIcon} title={name} alt={name} />
      </MapContainer>
    </div>
  )
}
