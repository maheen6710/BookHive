import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import NavbarSearch from "./NavbarSearch";
import "./Navbar.css";

const categories = [
  "Fiction", "Non-Fiction", "Academic",
  "Children's Books", "Textbooks",
  "Biographies", "Science Fiction", "Mystery & Thriller",
  "Poetry", "Self-Help", "Comics & Graphic Novels",
];

export default function Navbar({ user, setCurrentPage, onLogout }) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate(); 
  const location = useLocation();
  const activeCategory = location.pathname.startsWith("/category/")
    ? decodeURIComponent(location.pathname.split("/category/")[1])
    : null;

  return (
    <nav className="navbar">
      <div className="container">
        <div className="navbar-top">

          <div className="logo" onClick={() => navigate("/")}>
            <img src="/BookHive logo.jpeg" alt="BookHive Logo" className="logo-img" />
            <span className="logo-orange">Book</span><span className="logo-dark">Hive</span>
          </div>
         <NavbarSearch user={user} />

          <div className="nav-actions">
            {!user ? (
              <div className="auth-buttons">
                <button className="btn-outline" onClick={() => navigate("/login")}>Login</button>
                <button className="btn-orange" onClick={() => navigate("/signup")}>Sign Up</button>
              </div>
            ) : (
              <div className="user-menu">
                <div
                  className="user-dropdown-trigger"
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                  <i className="fas fa-user-circle"></i>
                  <span>{user.name}</span>
                  <i className="fas fa-chevron-down"></i>
                </div>
                {dropdownOpen && (
                  <div className="dropdown-menu">
                    <a 
                      href="#" 
                      onClick={(e) => {
                        e.preventDefault();
                        setDropdownOpen(false);
                        if (user.role === "seller") {
                          navigate("/sellerdashboard");
                        } else {
                          navigate("/buyerdashboard");
                        }
                      }}
                    >
                      View Dashboard
                    </a>
                    <button onClick={() => { onLogout(); setDropdownOpen(false); }}>
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="category-menu">
          {categories.map((cat) => (
            <a
              key={cat}
              href={`/category/${encodeURIComponent(cat)}`}
              className={`category-link ${activeCategory === cat ? "active" : ""}`}
              onClick={(e) => {
                e.preventDefault();
                navigate(`/category/${encodeURIComponent(cat)}`);
              }}
            >
              {cat}
            </a>
          ))}
        </div>
      </div>
    </nav>
  );
}
