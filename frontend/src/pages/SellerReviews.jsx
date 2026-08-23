import { useEffect, useState } from "react";
import axios from "axios";
import ReviewList from "../components/ReviewList";
import "./SellerReviews.css";

export default function SellerReviews() {
  const [allReviews, setAllReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    user = null;
  }

  useEffect(() => {
    const fetchAllReviews = async () => {
      if (!user?._id) return;

      try {
        // Step 1: get all seller's books
        const booksRes = await axios.get(
          `http://localhost:5000/api/books/seller/${user._id}`
        );
        const books = booksRes.data;

        // Step 2: for each book, fetch its reviews
        const reviewPromises = books.map((book) =>
          axios
            .get(`http://localhost:5000/api/reviews/${book._id}`)
            .then((res) =>
              // tag each review with the book title
              res.data.map((review) => ({
                ...review,
                bookTitle: book.book?.title,
              }))
            )
            .catch(() => []) // if one book fails, don't break everything
        );

        const results = await Promise.all(reviewPromises);

        // Step 3: flatten into one array, newest first
        const combined = results
          .flat()
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        setAllReviews(combined);
      } catch (err) {
        console.error("Failed to fetch reviews:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchAllReviews();
  }, []);

  return (
    <div className="seller-reviews-wrap">
      <div className="dashboard-card">
        <div className="card-header">
          <h2>⭐ My Book Reviews</h2>
        </div>
        <div className="card-body">
          <ReviewList reviews={allReviews} loading={loading} showBookTitle />
        </div>
      </div>
    </div>
  );
}
