import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./SellerLocationMap.css";

// 🔥 Leaflet's default marker icons break under bundlers like Vite/Webpack
// unless manually reconfigured — this is the standard fix.
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// custom blue dot icon for "you are here"
const finderIcon = new L.DivIcon({
  className: "finder-location-marker",
  html: `<div class="finder-dot"></div>`,
  iconSize: [16, 16],
});

// auto-fits the map to show all markers when the marker set changes
function FitBounds({ positions }) {
  const map = useMap();
  useEffect(() => {
    if (positions.length === 0) return;
    if (positions.length === 1) {
      map.setView(positions[0], 14);
    } else {
      map.fitBounds(positions, { padding: [40, 40] });
    }
  }, [positions, map]);
  return null;
}

/**
 * Props:
 *  - sellers: array of { _id, name, latitude, longitude, distanceKm?, shopAddress? }
 *  - finderLocation: { lat, lng } | null
 *  - height: CSS height for the map container (default 320px)
 */
export default function SellerLocationMap({ sellers = [], finderLocation, height = "320px" }) {
  const validSellers = sellers.filter((s) => s.latitude != null && s.longitude != null);

  const allPositions = [
    ...validSellers.map((s) => [s.latitude, s.longitude]),
    ...(finderLocation ? [[finderLocation.lat, finderLocation.lng]] : []),
  ];

  // fallback center if we have nothing to show yet (Islamabad, roughly)
  const defaultCenter = [33.6844, 73.0479];

  if (validSellers.length === 0 && !finderLocation) {
    return (
      <div className="slm-empty" style={{ height }}>
        <i className="fas fa-map-marker-alt"></i>
        <p>No location data available yet.</p>
      </div>
    );
  }

  return (
    <div className="slm-wrap" style={{ height }}>
      <MapContainer
        center={allPositions[0] || defaultCenter}
        zoom={13}
        style={{ height: "100%", width: "100%", borderRadius: "var(--radius, 10px)" }}
        scrollWheelZoom={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {finderLocation && (
          <Marker position={[finderLocation.lat, finderLocation.lng]} icon={finderIcon}>
            <Popup>You are here</Popup>
          </Marker>
        )}

        {validSellers.map((seller) => (
          <Marker key={seller._id} position={[seller.latitude, seller.longitude]}>
            <Popup>
              <strong>{seller.name}</strong>
              {seller.shopAddress && <><br />{seller.shopAddress}</>}
              {seller.distanceKm != null && (
                <><br /><span className="slm-distance">{seller.distanceKm.toFixed(1)} km away</span></>
              )}
            </Popup>
          </Marker>
        ))}

        <FitBounds positions={allPositions} />
      </MapContainer>
    </div>
  );
}
