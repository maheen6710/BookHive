import SellerLocationMap from "./SellerLocationMap";
import useGeolocation from "../hooks/useGeolocation";
import "./SellerDistanceBlock.css";

/**
 * Shared "distance to seller + map" block. Used on BookProductPage (single
 * listing) and SellerProfilePage (seller's own shop location).
 *
 * Props:
 *  - seller: { _id, name, latitude, longitude, shopAddress? }
 */
export default function SellerDistanceBlock({ seller }) {
  const { location: finderLocation, status: geoStatus } = useGeolocation();

  const hasSellerLocation = seller?.latitude != null && seller?.longitude != null;

  function openInGoogleMaps() {
    if (!hasSellerLocation) return;
    // destination-only link if we don't have finder's location, or full
    // directions (origin + destination) if we do
    const destination = `${seller.latitude},${seller.longitude}`;
    const url = finderLocation
      ? `https://www.google.com/maps/dir/?api=1&origin=${finderLocation.lat},${finderLocation.lng}&destination=${destination}`
      : `https://www.google.com/maps/search/?api=1&query=${destination}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  let distanceKm = null;
  if (hasSellerLocation && finderLocation) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371;
    const dLat = toRad(seller.latitude - finderLocation.lat);
    const dLon = toRad(seller.longitude - finderLocation.lng);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(finderLocation.lat)) * Math.cos(toRad(seller.latitude)) * Math.sin(dLon / 2) ** 2;
    distanceKm = R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
  }

  if (!hasSellerLocation) {
    return (
      <div className="sdb-box sdb-empty">
        <i className="fas fa-map-marker-alt"></i>
        <span>Seller hasn't set their shop location yet</span>
      </div>
    );
  }

  return (
    <div className="sdb-box">
      <div className="sdb-header">
        <span className="sdb-label">
          <i className="fas fa-location-arrow"></i> Distance
        </span>
        {distanceKm != null ? (
          <span className="sdb-distance">{distanceKm.toFixed(1)} km away</span>
        ) : geoStatus === "loading" ? (
          <span className="sdb-distance-pending">Calculating...</span>
        ) : (
          <span className="sdb-distance-unknown">Enable location to see distance</span>
        )}
      </div>

      <SellerLocationMap
        sellers={[{ ...seller, distanceKm }]}
        finderLocation={finderLocation}
        height="180px"
      />

      <button className="sdb-directions-btn" onClick={openInGoogleMaps}>
        <i className="fas fa-directions"></i> Get Directions
      </button>
    </div>
  );
}
