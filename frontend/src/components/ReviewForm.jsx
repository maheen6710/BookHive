import { useState } from "react";
import axios from "axios";
import "./ReviewForm.css";

export default function ReviewForm({ bookId, onReviewAdded }) {
  const [rating, setRating]         = useState(0);
  const [hovered, setHovered]       = useState(0);
  const [comment, setComment]       = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage]       = useState("");
  const [success, setSuccess]       = useState(false);

  async function handleSubmit() {
    if (!rating || !comment.trim()) {
      setMessage("⚠️ Please give a rating and write a comment.");
      return;
    }

    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      setMessage("⚠️ You must be logged in as a Book Finder.");
      return;
    }

    try {
      setSubmitting(true);
      setMessage("");
      const res = await axios.post(
        "http://localhost:5000/api/reviews",
        { bookId, rating, comment, username: user.name },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess(true);
      setRating(0);
      setComment("");
      onReviewAdded(res.data);
      setTimeout(() => setSuccess(false), 4000);
    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rf-wrap">
      <h4 className="rf-title"><i className="fas fa-pen"></i> Write a Review</h4>

      <div className="rf-stars">
        {[1, 2, 3, 4, 5].map((s) => (
          <i
            key={s}
            className={`fas fa-star rf-star ${s <= (hovered || rating) ? "star-filled" : "star-empty"}`}
            onMouseEnter={() => setHovered(s)}
            onMouseLeave={() => setHovered(0)}
            onClick={() => setRating(s)}
          ></i>
        ))}
      </div>

      <textarea
        className="rf-textarea"
        placeholder="Share your experience with this book..."
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={4}
      />

      {message && <p className="rf-message">{message}</p>}
      {success && <div className="rf-feedback">✅ Review added successfully!</div>}

      <button className="rf-submit" onClick={handleSubmit} disabled={submitting}>
        {submitting ? "Submitting..." : "Submit Review"}
      </button>
    </div>
  );
}