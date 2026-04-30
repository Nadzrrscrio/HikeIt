'use client'

import { useState } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

const customIcon = new L.Icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

const DEFAULT_CENTER = [-7.9826, 112.6286] as [number, number];

export default function MapSelector({ 
  onLocationChange 
}: { 
  onLocationChange: (lat: number, lng: number) => void 
}) {
  const [position, setPosition] = useState<L.LatLng | null>(null)

  function LocationMarker() {
    useMapEvents({
      click(e) {
        setPosition(e.latlng) 
        onLocationChange(e.latlng.lat, e.latlng.lng) 
      }
    })

    return position === null ? null : (
      <Marker position={position} icon={customIcon} />
    )
  }

  return (
    <div className="h-[300px] w-full rounded-xl overflow-hidden border border-[#2e2e2e] z-0 relative">
      <MapContainer 
        center={DEFAULT_CENTER} 
        zoom={13} 
        scrollWheelZoom={true} 
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <LocationMarker />
      </MapContainer>
    </div>
  )
}