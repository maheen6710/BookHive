import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import BookCard from "../components/BookCard";
import "./CategoryPage.css";

export default function CategoryPage() {
  const { categoryName } = useParams();
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`http://localhost:5000/api/books/category/${encodeURIComponent(categoryName)}`)
      .then((res) => res.json())
      .then((data) => {
        setListings(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [categoryName]);

  return (
    <div className="category-page">
      {loading ? (
        <p>Loading...</p>
      ) : listings.length === 0 ? (
        <p>No books found in this category yet.</p>
      ) : (
        <div className="book-grid">
          {listings.map((listing) => (
            <BookCard
              key={listing._id}
              _id={listing._id}
              title={listing.book?.title}
              price={listing.price}
              coverImage={listing.coverImage}
              location={listing.shopLocation}
            />
          ))}
        </div>
      )}
    </div>
  );
}
