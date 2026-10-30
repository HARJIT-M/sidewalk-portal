import { useEffect, useMemo, useRef } from "react";
import { MapContainer, Marker, TileLayer, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const DEFAULT_CENTER = [11.0168, 76.9558];

const markerIcon = L.divIcon({
  className: "map-pin-marker",
  html: `
    <span style="display:block;width:18px;height:18px;border-radius:50%;background:#2563eb;border:3px solid #fff;box-shadow:0 3px 12px rgba(37,99,235,0.45);"></span>
  `,
  iconSize: [18, 18],
  iconAnchor: [9, 9],
});

const MapCursor = ({ value, onPinSet }) => {
  const map = useMapEvents({
    click: (event) => {
      const { lat, lng } = event.latlng;
      onPinSet(lat, lng);
    },
  });

  useEffect(() => {
    if (!value) return;
    map.flyTo([value.lat, value.lng], Math.max(map.getZoom(), 13), {
      animate: true,
      duration: 0.4,
    });
  }, [map, value]);

  return null;
};

const MapPicker = ({ value, onPinSet, areaStatus, areaName }) => {
  const position = useMemo(
    () => (value ? [value.lat, value.lng] : DEFAULT_CENTER),
    [value]
  );

  const markerRef = useRef(null);

  const handleMarkerDragEnd = (event) => {
    const marker = event.target;
    const { lat, lng } = marker.getLatLng();
    onPinSet(lat, lng);
  };

  return (
    <div className="map-picker-shell">
      <div className="map-picker" aria-label="Location picker map">
        <MapContainer
          center={position}
          zoom={13}
          scrollWheelZoom={false}
          className="map-picker-map"
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <MapCursor value={value} onPinSet={onPinSet} />
          <Marker
            ref={markerRef}
            position={position}
            draggable
            icon={markerIcon}
            eventHandlers={{ dragend: handleMarkerDragEnd }}
          />
        </MapContainer>
      </div>

      <div className="map-hint">
        {areaStatus === "detecting" && "Detecting service area..."}
        {areaStatus === "ok" && areaName && `Area detected: ${areaName}`}
        {areaStatus === "unconfigured" &&
          `No manager is mapped${areaName ? ` for ${areaName}` : " to this location"} yet. Your complaint can still be submitted and will be queued for administrator routing.`}
        {areaStatus === "state-restricted" &&
          "This service currently accepts complaints from Tamil Nadu only."}
        {areaStatus === "state-unconfirmed" &&
          "Unable to confirm the state for this pin. Your complaint can still be submitted and will be queued for administrator routing."}
        {areaStatus === "error" && "Unable to resolve this location."}
        {areaStatus === "idle" && "Tap the map or drag the pin to choose a location."}
      </div>
    </div>
  );
};

export default MapPicker;
