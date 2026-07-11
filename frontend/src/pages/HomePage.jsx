import { useState, useEffect } from "react";
import axios from "axios";
import HeroSlider from "../components/HeroSlider";
import BookCard from "../components/BookCard";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";

export default function HomePage({ setCurrentPage, user }) {
  const [books, setBooks] = useState([]);
  const navigate = useNavigate();

  // 🔥 Fetch books from backend
  useEffect(() => {
    const fetchBooks = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/books"
        );
        setBooks(res.data);
      } catch (err) {
        console.log(err);
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
          {books.length > 0 ? (
            books.map((book) => (
              <BookCard
                key={book._id}
                _id={book._id}     
                title={book.title}
                price={book.price}
                location={book.shopLocation}
                 coverImage={book.coverImage} 
              />
            ))
          ) : (
            <p>No books available right now </p>
          )}
        </div>
      </section>
{/* LOGIN CARDS */}<section className="container section">
  {!user && <h2 className="section-title">Get Started</h2>}
  
  <div className="login-cards">
    {!user && (
      <>
        <div className="login-card seller" onClick={() => navigate("/login")}>
          <h3>Login as Seller</h3>
          <p>Add and manage your books</p>
        </div>
        <div className="login-card buyer" onClick={() => navigate("/login")}>
          <h3>Login as Buyer</h3>
          <p>Find books near you</p>
        </div>
      </>
    )}

    {user?.role === "seller" && (
      <div className="login-card buyer" onClick={() => navigate("/signup")}>
        <h3>Signup as Buyer</h3>
        <p>Create a buyer account and find books near you</p>
      </div>
    )}

    {user?.role === "finder" && (
      <div className="login-card seller" onClick={() => navigate("/signup")}>
        <h3>Signup as Seller</h3>
        <p>Create a seller account and list your books</p>
      </div>
    )}
  </div>
</section>

    </div>
  );
}