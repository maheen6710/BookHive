import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SellerProfilePage.css";
import ReviewList from "../components/ReviewList";

export default function SellerProfilePage() {
  const { sellerId } = useParams();
  const navigate     = useNavigate();

  const [seller, setSeller]         = useState(null);
  const [books, setBooks]           = useState([]);
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [notFound, setNotFound]     = useState(false);

  useEffect(() => {
    async function fetchSellerData() {
      try {
        const [sellerRes, booksRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${sellerId}`),
          axios.get(`http://localhost:5000/api/books/seller/${sellerId}`),
        ]);
        setSeller(sellerRes.data);
        setBooks(booksRes.data);

        // fetch reviews for all seller's books in parallel
        const bookIds = booksRes.data.map((b) => b._id);
        const reviewRequests = bookIds.map((id) =>
          axios.get(`http://localhost:5000/api/reviews/${id}`)
        );
        const reviewResults = await Promise.all(reviewRequests);
        const allReviews = reviewResults.flatMap((r) => r.data);
        setReviews(allReviews);

      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    }
    fetchSellerData();
  }, [sellerId]);

  function conditionBadgeClass(c) {
    return { "new": "badge-new", "like-new": "badge-likenew", "good": "badge-good", "fair": "badge-fair" }[c] || "";
  }

  if (loading) return (
    <div className="spp-loading">
      <div className="spp-spinner"></div>
      <p>Loading seller profile...</p>
    </div>
  );

  if (notFound) return (
    <div className="spp-notfound">
      <i className="fas fa-user-slash"></i>
      <h2>Seller not found</h2>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="spp-page">
      <div className="spp-layout">

        {/* ── LEFT: seller info card ── */}
        <aside className="spp-sidebar">

          <div className="spp-avatar-wrap">
            <div className="spp-avatar">
              <i className="fas fa-user"></i>
            </div>
            <span className="spp-verified"><i className="fas fa-store"></i> Seller</span>
          </div>

          <h2 className="spp-name">{seller.name}</h2>

          <div className="spp-meta-list">
            {seller.location && (
              <div className="spp-meta-item">
                <i className="fas fa-map-marker-alt"></i>
                <span>{seller.location}</span>
              </div>
            )}
            {seller.shopName && (
              <div className="spp-meta-item">
                <i className="fas fa-store"></i>
                <span>{seller.shopName}</span>
              </div>
            )}
            {seller.shopAddress && (
              <div className="spp-meta-item">
                <i className="fas fa-map-pin"></i>
                <span>{seller.shopAddress}</span>
              </div>
            )}
            <div className="spp-meta-item">
              <i className="fas fa-book"></i>
              <span>{books.length} book{books.length !== 1 ? "s" : ""} listed</span>
            </div>
          </div>

          {/* rating summary — only show if real reviews exist */}
          {avgRating && (
            <div className="spp-rating-box">
              <span className="spp-avg">{avgRating}</span>
              <div>
                <div className="spp-stars">
                  {[1,2,3,4,5].map(s => (
                    <i key={s} className={`fas fa-star ${s <= Math.round(avgRating) ? "star-filled" : "star-empty"}`}></i>
                  ))}
                </div>
                <span className="spp-review-count">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )}

          <button className="spp-chat-btn">
            <i className="fas fa-comment-dots"></i> Chat with Seller
          </button>

        </aside>

        {/* ── RIGHT: books + reviews ── */}
        <div className="spp-main">

          {/* listed books */}
          <section className="spp-section">
            <h3 className="spp-section-title">
              <i className="fas fa-book-open"></i> Listed Books
            </h3>

            {books.length === 0 ? (
              <p className="spp-none">This seller hasn't listed any books yet.</p>
            ) : (
              <div className="spp-books-grid">
                {books.map((book) => (
                  <div
                    key={book._id}
                    className="spp-book-card"
                    onClick={() => navigate(`/book/${book._id}`)}
                  >
                    <div className="spp-book-cover">
                      {book.coverImage ? (
                        <img src={`http://localhost:5000${book.coverImage}`} alt={book.title} />
                      ) : (
                        <div className="spp-cover-placeholder">
                          <i className="fas fa-book"></i>
                        </div>
                      )}
                      <span className={`spp-condition ${conditionBadgeClass(book.condition)}`}>
                        {book.condition}
                      </span>
                    </div>
                    <div className="spp-book-info">
                      <p className="spp-book-title">{book.title}</p>
                      <p className="spp-book-author">by {book.author}</p>
                      {book.category && (
                        <span className="spp-book-cat">
                          <i className="fas fa-tag"></i> {book.category}
                        </span>
                      )}
                      <p className="spp-book-price">Rs. {book.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* reviews — real data, no dummy */}
          <section className="spp-section">
            <h3 className="spp-section-title">
              <i className="fas fa-star"></i> Reviews
            </h3>
            <ReviewList reviews={reviews} loading={reviewsLoading} />
          </section>

        </div>
      </div>
    </div>
  );
}