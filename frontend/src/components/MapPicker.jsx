import { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

// Fix default marker icons when bundling with Vite.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

function ClickCapture({ onPick }) {
  useMapEvents({
    click(e) { onPick(e.latlng.lat, e.latlng.lng); },
  });
  return null;
}

function Recenter({ lat, lng }) {
  const map = useMap();
  useEffect(() => {
    if (lat && lng) map.setView([lat, lng], map.getZoom());
  }, [lat, lng, map]);
  return null;
}

// Click/drag to drop a pin. `value` = {lat, lng}; calls onChange(lat, lng).
export default function MapPicker({ value, onChange, center }) {
  const lat = value?.lat ?? center?.lat ?? 6.9271;
  const lng = value?.lng ?? center?.lng ?? 79.8612;
  return (
    <div className="map">
      <MapContainer center={[lat, lng]} zoom={12} scrollWheelZoom>
        <TileLayer
          attribution='&copy; OpenStreetMap contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <ClickCapture onPick={onChange} />
        {center && <Recenter lat={center.lat} lng={center.lng} />}
        {value?.lat && (
          <Marker
            position={[value.lat, value.lng]}
            draggable
            eventHandlers={{ dragend: (e) => { const p = e.target.getLatLng(); onChange(p.lat, p.lng); } }}
          />
        )}
      </MapContainer>
    </div>
  );
}
