import { useState, useEffect } from "react";
import axios from "axios";
import HeroSlider from "../components/HeroSlider";
import BookCard from "../components/BookCard";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";

export default function HomePage({ setCurrentPage, user }) {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  //  Fetch listings from backend
   useEffect(() => {
    const fetchBooks = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await axios.get(
          "http://localhost:5000/api/books"
        );
        setBooks(res.data);
      } catch (err) {
        console.log(err);
        setError("Couldn't load books right now. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBooks();
  }, []);

  return (
    <div className="home-page">
      <HeroSlider />

      {/* REAL BOOKS FROM DATABASE */}
      <section className="container section">
        <h2 className="section-title">Available Books</h2>

        <div className="books-grid">
          {loading ? (
            <p>Loading books...</p>
          ) : error ? (
            <p className="error-text">{error}</p>
          ) : books.length > 0 ? (
            books.map((listing) => (
              <BookCard
                key={listing._id}
                _id={listing._id}     
                title={listing.book?.title}
                price={listing.price}
                location={listing.shopLocation}
                coverImage={listing.coverImage} 
              />
            ))
          ) : (
            <p>No books available yet.</p>
          )}
        </div>
      </section>
{/* LOGIN CARDS */}<section className="container section">
  {!user && <h2 className="section-title">Get Started</h2>}
  
  <div className="login-cards">
    {!user && (
      <>
        <div className="login-card" onClick={() => navigate("/login")}>
          <h3>Login as Seller</h3>
          <p>Sell and manage your books</p>
        </div>
        <div className="login-card" onClick={() => navigate("/login")}>
          <h3>Login as Buyer</h3>
          <p>Find books near you</p>
        </div>
      </>
    )}

    {user?.role === "seller" && (
      <div className="login-card" onClick={() => navigate("/signup")}>
        <h3>Signup as Buyer</h3>
        <p>Create a buyer account and find books near you</p>
      </div>
    )}

    {user?.role === "finder" && (
      <div className="login-card" onClick={() => navigate("/signup")}>
        <h3>Signup as Seller</h3>
        <p>Create a seller account and list your books</p>
      </div>
    )}
        </div>
      </section>
    </div>
  );
}
