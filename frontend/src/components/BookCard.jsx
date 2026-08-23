import { useNavigate } from "react-router-dom";
import "./BookCard.css";


export default function BookCard({ _id, title, price, location, coverImage }) {
  const navigate = useNavigate();

  return (
    <div className="book-card" onClick={() => navigate(`/book/${_id}`)} style={{ cursor: "pointer" }}>
      <div className="book-image">
        {coverImage ? (
          <img
            src={`http://localhost:5000${coverImage}`}
            alt={title}
            className="book-cover"
          />
        ) : (
          <span>Book Image</span>
        )}
      </div>

      <div className="book-info">
        <h3 className="book-title">{title}</h3>

        <div className="book-price">
          <span className="price-main">Rs. {price}</span>
        </div>

        <div className="book-location">
          <i className="fas fa-map-marker-alt"></i>
          <span>{location}</span>
        </div>
      </div>
    </div>
  );
}
