import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SearchResultsPage.css";

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams();
  const query          = searchParams.get("q") || "";
  const navigate       = useNavigate();

  const [results, setResults]   = useState([]);
  const [loading, setLoading]   = useState(false);
  const [searched, setSearched] = useState(false);

  useEffect(() => {
    if (query.trim()) fetchResults(query.trim());
  }, [query]);

  async function fetchResults(term) {
    try {
      setLoading(true);
      setSearched(false);
      const res = await axios.get(
        `http://localhost:5000/api/books?search=${encodeURIComponent(term)}`
      );
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
      </div>

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
          {results.map((book) => (
            <div
              key={book._id}
              className="srp-card"
              onClick={() => navigate(`/book/${book._id}`)}
              style={{ cursor: "pointer" }}
            >
              <div className="srp-cover">
                {book.coverImage ? (
                  <img src={`http://localhost:5000${book.coverImage}`} alt={book.title} />
                ) : (
                  <div className="srp-cover-placeholder"><i className="fas fa-book"></i></div>
                )}
                <span className={`srp-condition ${conditionBadgeClass(book.condition)}`}>
                  {book.condition}
                </span>
              </div>

              <div className="srp-info">
                <h3 className="srp-title">{book.title}</h3>
                <p className="srp-author">by {book.author}</p>
                {book.edition && <p className="srp-edition">{book.edition}</p>}
                {book.category && (
                  <span className="srp-category">
                    <i className="fas fa-tag"></i> {book.category}
                  </span>
                )}
              </div>

              <div className="srp-footer">
                <div className="srp-seller">
                  <i className="fas fa-store"></i>
                  <div>
                    <span className="srp-seller-name">{book.seller?.name || "Unknown Seller"}</span>
                    {book.seller?.location && (
                      <span className="srp-location">{book.seller.location}</span>
                    )}
                  </div>
                </div>
                <span className="srp-price">Rs. {book.price}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
