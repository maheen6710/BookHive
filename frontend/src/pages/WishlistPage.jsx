import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./WishlistPage.css";

export default function WishlistPage() {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading]   = useState(true);
  const navigate                = useNavigate();

  // ── modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [modalBookTitle, setModalBookTitle] = useState("");
  const [modalListingId, setModalListingId] = useState(null);

  // ── toast state ──
  const [toast, setToast] = useState({ show: false, message: "" });

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

  // ── open modal with book info ──
  function openRemoveModal(listingId, bookTitle) {
    setModalListingId(listingId);
    setModalBookTitle(bookTitle || "this book");
    setModalOpen(true);
  }

  // ── confirm removal ──
  async function confirmRemove() {
    if (!modalListingId) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/wishlist/${modalListingId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist((prev) => prev.filter((l) => l._id !== modalListingId));
      showToast("Book removed from wishlist");
    } catch (err) {
      console.error("Failed to remove:", err);
      showToast("Could not remove book");
    } finally {
      setModalOpen(false);
      setModalListingId(null);
    }
  }

  // ── close modal ──
  function closeModal() {
    setModalOpen(false);
    setModalListingId(null);
  }

  // ── show toast ──
  function showToast(message) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
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
            <div key={listing._id} className="wl-item">
              <div className="wl-cover" onClick={() => navigate(`/book/${listing._id}`)}>
                {listing.coverImage ? (
                  <img src={`http://localhost:5000${listing.coverImage}`} alt={listing.book?.title} />
                ) : (
                  <div className="wl-cover-placeholder">
                    <i className="fas fa-book"></i>
                  </div>
                )}
              </div>

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
                  onClick={() => openRemoveModal(listing._id, listing.book?.title)}
                >
                  <i className="fas fa-trash"></i> Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── TOAST ── */}
      {toast.show && (
        <div className="wl-toast">
          {toast.message}
        </div>
      )}

      {/* ── CONFIRM MODAL ── */}
      {modalOpen && (
        <div className="wl-modal-overlay" onClick={closeModal}>
          <div className="wl-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="wl-modal-title">Remove from Wishlist</h3>
            <p className="wl-modal-message">
              Are you sure you want to remove <strong>“{modalBookTitle}”</strong> from your wishlist?
            </p>
            <div className="wl-modal-actions">
              <button className="wl-modal-btn wl-modal-cancel" onClick={closeModal}>
                Cancel
              </button>
              <button className="wl-modal-btn wl-modal-confirm" onClick={confirmRemove}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}