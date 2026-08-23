import "./ReviewList.css";

export default function ReviewList({ reviews, loading, showBookTitle = false }) {
  if (loading) return <p className="rl-loading">Loading reviews...</p>;

  if (reviews.length === 0)
    return <p className="rl-empty">No reviews yet.</p>;

  const avgRating = (
    reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
  ).toFixed(1);

  return (
    <div className="rl-wrap">
      <div className="rl-summary">
        <span className="rl-big-rating">{avgRating}</span>
        <div className="rl-stars-col">
          <div className="rl-stars">
            {[1, 2, 3, 4, 5].map((s) => (
              <i
                key={s}
                className={`fas fa-star ${
                  s <= Math.round(avgRating) ? "star-filled" : "star-empty"
                }`}
              ></i>
            ))}
          </div>
          <span className="rl-count">
            Based on {reviews.length} review{reviews.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      <div className="rl-list">
        {reviews.map((r) => (
          <div key={r._id} className="rl-card">
            <div className="rl-header">
              <div className="rl-avatar">{r.username?.[0]?.toUpperCase()}</div>
              <div>
                <p className="rl-name">{r.username}</p>
                <div className="rl-stars">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <i
                      key={s}
                      className={`fas fa-star ${
                        s <= r.rating ? "star-filled" : "star-empty"
                      }`}
                    ></i>
                  ))}
                </div>
              </div>
              <span className="rl-date">
                {new Date(r.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </div>
            
            {showBookTitle && r.bookTitle && (
              <p className="rl-book-title">📖 {r.bookTitle}</p>
            )}
            <p className="rl-comment">{r.comment}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
