import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./WishlistPage.css";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]); // array of LISTINGS now
  const [loading, setLoading]   = useState(true);
  const navigate                = useNavigate();

  useEffect(() => {
    fetchWishlist();
  }, []);

  async function fetchWishlist() {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/wishlist", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist(res.data);
    } catch (err) {
      console.error("Failed to fetch wishlist:", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleRemove(listingId) {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/wishlist/${listingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist((prev) => prev.filter((l) => l._id !== listingId));
    } catch (err) {
      console.error("Failed to remove:", err);
    }
  }

  function conditionColor(condition) {
    const map = { "new": "#4ade80", "like-new": "#60a5fa", "good": "#fbbf24", "fair": "#f87171" };
    return map[condition] || "#94a3b8";
  }

  if (loading) return (
    <div className="wl-loading">
      <div className="wl-spinner"></div>
      <p>Loading your wishlist...</p>
    </div>
  );

  return (
    <div className="wl-page">
      <div className="wl-header">
        <h2 className="wl-title">
          <i className="fas fa-heart"></i> My Wishlist
        </h2>
        <span className="wl-count">{wishlist.length} book{wishlist.length !== 1 ? "s" : ""} saved</span>
      </div>

      {wishlist.length === 0 ? (
        <div className="wl-empty">
          <i className="fas fa-heart-broken"></i>
          <p>Your wishlist is empty</p>
          <small>Browse books and click the heart icon to save them here</small>
          <button className="wl-browse-btn" onClick={() => navigate("/")}>
            Browse Books
          </button>
        </div>
      ) : (
        <div className="wl-list">
          {wishlist.map((listing) => (
            <div
              key={listing._id}
              className="wl-item"
            >
              {/* cover — clicking navigates to product page */}
              <div className="wl-cover" onClick={() => navigate(`/book/${listing._id}`)}>
                {listing.coverImage ? (
                  <img src={`http://localhost:5000${listing.coverImage}`} alt={listing.book?.title} />
                ) : (
                  <div className="wl-cover-placeholder">
                    <i className="fas fa-book"></i>
                  </div>
                )}
              </div>

              {/* info */}
              <div className="wl-info" onClick={() => navigate(`/book/${listing._id}`)}>
                <h3 className="wl-book-title">{listing.book?.title}</h3>
                <p className="wl-book-author">by {listing.book?.author}</p>

                <div className="wl-meta">
                  {listing.book?.category && (
                    <span className="wl-tag">
                      <i className="fas fa-tag"></i> {listing.book.category}
                    </span>
                  )}
                  <span
                    className="wl-tag wl-condition"
                    style={{ color: conditionColor(listing.condition) }}
                  >
                    ● {listing.condition}
                  </span>
                  {listing.book?.edition && (
                    <span className="wl-tag">{listing.book.edition}</span>
                  )}
                </div>

                {listing.seller && (
                  <p className="wl-seller">
                    <i className="fas fa-store"></i>{" "}
                    {listing.seller.name}
                    {listing.seller.location && ` · ${listing.seller.location}`}
                  </p>
                )}
              </div>

              {/* right: price + actions */}
              <div className="wl-right">
                <p className="wl-price">Rs. {listing.price}</p>
                <button
                  className="wl-view-btn"
                  onClick={() => navigate(`/book/${listing._id}`)}
                >
                  <i className="fas fa-eye"></i> View
                </button>
                <button
                  className="wl-remove-btn"
                  onClick={() => handleRemove(listing._id)}
                >
                  <i className="fas fa-trash"></i> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
