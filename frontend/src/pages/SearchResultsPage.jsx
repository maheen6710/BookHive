import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SearchResultsPage.css";
import useGeolocation from "../hooks/useGeolocation";
import SellerLocationMap from "../components/SellerLocationMap";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query          = searchParams.get("q") || "";
  const navigate       = useNavigate();
  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);
  const [showMap, setShowMap]   = useState(false);
  const { location: finderLocation, status: geoStatus, error: geoError } = useGeolocation();

  useEffect(() => {
    if (query.trim()) fetchResults(query.trim());
  }, [query, finderLocation]);

  async function fetchResults(term) {
    try {
      setLoading(true);
      setSearched(false);

      const params = { search: term };
      if (finderLocation) {
        params.lat = finderLocation.lat;
        params.lng = finderLocation.lng;
      }

      const res = await axios.get("http://localhost:5000/api/books", { params });
      setResults(res.data);
    } catch (err) {
      console.error("Search error:", err);
      setResults([]);
    } finally {
      setLoading(false);
      setSearched(true);
    }
  }

  function conditionBadgeClass(condition) {
    const map = { "new": "badge-new", "like-new": "badge-likenew", "good": "badge-good", "fair": "badge-fair" };
    return map[condition] || "";
  }

  const sellersForMap = results
    .filter((l) => l.seller?.latitude != null && l.seller?.longitude != null)
    .map((l) => ({
      _id: l.seller._id,
      name: l.seller.name,
      latitude: l.seller.latitude,
      longitude: l.seller.longitude,
      shopAddress: l.seller.location,
      distanceKm: l.distanceKm,
    }));

  return (
    <div className="srp-page">
      <div className="srp-header">
        <button className="srp-back" onClick={() => navigate(-1)}>
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <div className="srp-heading">
          {loading ? <span>Searching...</span> : searched ? (
            <>
              <span className="srp-count">{results.length}</span>
              &nbsp;listing{results.length !== 1 ? "s" : ""} found for
              <span className="srp-query"> "{query}"</span>
            </>
          ) : null}
        </div>

        {geoStatus === "granted" && sellersForMap.length > 0 && (
          <button className="srp-map-toggle" onClick={() => setShowMap((s) => !s)}>
            <i className="fas fa-map"></i> {showMap ? "Hide Map" : "Show Map"}
          </button>
        )}
      </div>

      {geoStatus === "denied" && (
        <div className="srp-geo-notice">
          <i className="fas fa-exclamation-triangle"></i> {geoError} — results aren't sorted by distance.
        </div>
      )}

      {showMap && geoStatus === "granted" && (
        <div className="srp-map-wrap">
          <SellerLocationMap
            sellers={sellersForMap}
            finderLocation={finderLocation}
            height="360px"
          />
        </div>
      )}

      {loading && (
        <div className="srp-grid">
          {[...Array(6)].map((_, i) => <div key={i} className="srp-skeleton"></div>)}
        </div>
      )}

      {!loading && searched && results.length === 0 && (
        <div className="srp-empty">
          <i className="fas fa-book-open"></i>
          <p>No listings found for "{query}"</p>
          <small>Try a different title or check for typos</small>
        </div>
      )}

      {!loading && results.length > 0 && (
        <div className="srp-grid">
          {results.map((listing) => (
            <div
              key={listing._id}
              className="srp-card"
              onClick={() => navigate(`/book/${listing._id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="srp-cover">
                {listing.coverImage ? (
                  <img src={`http://localhost:5000${listing.coverImage}`} alt={listing.book?.title} />
                ) : (
                  <div className="srp-cover-placeholder"><i className="fas fa-book"></i></div>
                )}
                <span className={`srp-condition ${conditionBadgeClass(listing.condition)}`}>
                  {listing.condition}
                </span>
              </div>

              <div className="srp-info">
                <h3 className="srp-title">{listing.book?.title}</h3>
                <p className="srp-author">by {listing.book?.author}</p>
                {listing.book?.edition && <p className="srp-edition">{listing.book.edition}</p>}
                {listing.book?.category && (
                  <span className="srp-category">
                    <i className="fas fa-tag"></i> {listing.book.category}
                  </span>
                )}
              </div>

              <div className="srp-footer">
                <div className="srp-seller">
                  <i className="fas fa-store"></i>
                  <div>
                    <span className="srp-seller-name">{listing.seller?.name || "Unknown Seller"}</span>
                    {listing.seller?.location && (
                      <span className="srp-location">{listing.seller.location}</span>
                    )}
                    {listing.distanceKm != null && (
                      <span className="srp-distance">📍 {listing.distanceKm.toFixed(1)} km away</span>
                    )}
                  </div>
                </div>
                <span className="srp-price">Rs. {listing.price}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
