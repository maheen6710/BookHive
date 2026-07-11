import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./BookProductPage.css";
import ReviewList from "../components/ReviewList";
import ReviewForm from "../components/ReviewForm";

export default function BookProductPage() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const [book, setBook]             = useState(null);
  const [loading, setLoading]       = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [wishlisted, setWishlisted] = useState(false);
  const [wlLoading, setWlLoading]   = useState(false);
  const [wlMessage, setWlMessage] = useState("");
  const [reviews, setReviews]         = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const currentUser = JSON.parse(localStorage.getItem("user"));

useEffect(() => {
  async function fetchBook() {
    try {
      const res = await axios.get(`http://localhost:5000/api/books/${id}`);
      setBook(res.data);
      const reviewRes = await axios.get(`http://localhost:5000/api/reviews/${id}`);
      setReviews(reviewRes.data);
      setReviewsLoading(false);

      // ✅ FIX: separate try/catch so wishlist 401 doesn't trigger "Book not found"
      const token = localStorage.getItem("token");
      if (token) {
        try {
          const wlRes = await axios.get("http://localhost:5000/api/wishlist", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const alreadySaved = wlRes.data.some((b) => b._id === id);
          setWishlisted(alreadySaved);
        } catch (wlErr) {
          console.warn("Wishlist check failed:", wlErr.response?.status);
          // silently fail — user just won't see wishlisted state
        }
      }

    } catch (err) {
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }
  fetchBook();
}, [id]);

 async function handleWishlist() {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) { navigate("/login"); return; }
  if (user.role !== "finder") { showMessage("Only buyers can add to wishlist."); return; }

  try {
    setWlLoading(true);
    if (!wishlisted) {
      await axios.post(`http://localhost:5000/api/wishlist/${id}`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlisted(true);
      showMessage("✅ Added to wishlist!");
    } else {
      showMessage("📚 Already in your wishlist!");
    }
  } catch (err) {
    if (err.response?.status === 400) {
      showMessage("📚 Already in your wishlist!");
    } else {
      showMessage("❌ Something went wrong.");
    }
  } finally {
    setWlLoading(false);
  }
}

function handleBuyNow() {
  const token = localStorage.getItem("token");
  const user  = JSON.parse(localStorage.getItem("user"));

  if (!token || !user) { navigate("/login"); return; }

  const sellerId = book.seller?._id || book.seller;
  if (user._id === sellerId?.toString()) {
    showMessage("This is your own listing!"); return;
  }

  if (user.role !== "finder") {
    showMessage("Only buyers can purchase books."); return;
  }

  navigate(`/checkout/${book._id}`);
}

function handleReviewAdded(newReview) {
  setReviews((prev) => [newReview, ...prev]);
}

function showMessage(msg) {
  setWlMessage(msg);
  setTimeout(() => setWlMessage(""), 3000);
}

  async function handleChatWithSeller() {
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user"));

   if (!token || !user) { 
    navigate("/login", { state: { from: `/checkout/${bookId}` } });
     return; 
    }

    const sellerId = book.seller?._id || book.seller;
    if (user._id === sellerId?.toString()) {
      showMessage("This is your own listing!");
      return;
    }

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/conversations/start",
        { bookId: book._id, sellerId: book.seller?._id || book.seller },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/buyerdashboard", { state: { openConvoId: data._id } });
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.message || "Could not start conversation.");
    }
  }

  function conditionBadgeClass(c) {
    return { "new": "badge-new", "like-new": "badge-likenew", "good": "badge-good", "fair": "badge-fair" }[c] || "";
  }

  if (loading) return (
    <div className="bpp-loading">
      <div className="bpp-spinner"></div>
      <p>Loading book details...</p>
    </div>
  );

  if (notFound) return (
    <div className="bpp-notfound">
      <i className="fas fa-book-open"></i>
      <h2>Book not found</h2>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="bpp-page">

      <div className="bpp-layout">

        {/* LEFT */}
        <div className="bpp-left">
          <div className="bpp-cover-wrap">
            {book.coverImage ? (
              <img src={`http://localhost:5000${book.coverImage}`} alt={book.title} className="bpp-cover" />
            ) : (
              <div className="bpp-cover-placeholder"><i className="fas fa-book"></i></div>
            )}
            <span className={`bpp-condition ${conditionBadgeClass(book.condition)}`}>
              {book.condition}
            </span>
          </div>

          <div className="bpp-actions">
            <button
              className={`bpp-btn-wishlist ${wishlisted ? "wishlisted" : ""}`}
              onClick={handleWishlist}
              disabled={wlLoading}
            >
              <i className={`${wishlisted ? "fas" : "far"} fa-heart`}></i>
              {wlLoading ? "Updating..." : wishlisted ? "Wishlisted" : "Add to Wishlist"}
            </button>

            <button className="bpp-btn-chat" onClick={handleChatWithSeller}>
              <i className="fas fa-comment-dots"></i> Chat with Seller
            </button>

            <button className="bpp-btn-buy" onClick={handleBuyNow}>
            <i className="fas fa-shopping-bag"></i> Buy Now
          </button>
          </div>
        </div>

        {/* RIGHT */}
        <div className="bpp-right">
          <div className="bpp-hero">
            <h1 className="bpp-title">{book.title}</h1>
            <p className="bpp-author">Author: <span>{book.author}</span></p>
          </div>

          <div className="bpp-price-row">
            <span className="bpp-price">Rs. {book.price}</span>
          </div>

          <div className="bpp-details-grid">
            {book.category && (
              <div className="bpp-detail-item">
                <span className="bpp-detail-label"><i className="fas fa-tag"></i> Category</span>
                <span className="bpp-detail-value">{book.category}</span>
              </div>
            )}
            {book.edition && (
              <div className="bpp-detail-item">
                <span className="bpp-detail-label"><i className="fas fa-layer-group"></i> Edition</span>
                <span className="bpp-detail-value">{book.edition}</span>
              </div>
            )}
            <div className="bpp-detail-item">
              <span className="bpp-detail-label"><i className="fas fa-star-half-alt"></i> Condition</span>
              <span className={`bpp-detail-value bpp-cond-text ${conditionBadgeClass(book.condition)}`}>
                {book.condition}
              </span>
            </div>
            {book.shopLocation && (
              <div className="bpp-detail-item">
                <span className="bpp-detail-label"><i className="fas fa-map-marker-alt"></i> Location</span>
                <span className="bpp-detail-value">{book.shopLocation}</span>
              </div>
            )}
          </div>

          <div className="bpp-divider"></div>

          <div className="bpp-seller-card">
            <div className="bpp-seller-avatar"><i className="fas fa-user"></i></div>
            <div className="bpp-seller-info">
              <div
                className="bpp-seller-card bpp-seller-clickable"
                onClick={() => navigate(`/seller/${book.seller?._id}`)}
              >
                <p className="bpp-seller-label">Listed by</p>
                <p className="bpp-seller-name">{book.seller?.name || "Unknown Seller"}</p>
              </div>
              {book.seller?.location && (
                <p className="bpp-seller-loc"><i className="fas fa-store"></i> {book.seller.location}</p>
              )}
            </div>
          </div>

          <div className="bpp-divider"></div>

          <div className="bpp-reviews">
            <h3 className="bpp-reviews-title"><i className="fas fa-star"></i> Reviews</h3>

            <ReviewList reviews={reviews} loading={reviewsLoading} />

            {(() => {
              const user = JSON.parse(localStorage.getItem("user"));
              return user?.role === "finder" ? (
                <ReviewForm bookId={id} onReviewAdded={handleReviewAdded} />
              ) : null;
            })()}
          </div>
        </div>
      </div>

      {wlMessage && (
        <div className="bpp-toast">{wlMessage}</div>
      )}
    </div>
  );
}
