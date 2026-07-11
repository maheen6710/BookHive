import { useState, useEffect } from "react";
import { useNavigate, useLocation  } from "react-router-dom";
import BookCard from "../components/BookCard";
import WishlistPage from "./WishlistPage";
import ConversationList from "../pages/ConversationList";
import ChatPage from "../pages/ChatPage";
import "./Dashboard.css";

export default function BuyerDashboard() {
  const [activeNav, setActiveNav] = useState("discover");
  const [books, setBooks]         = useState([]);
  const [activeChatId, setActiveChatId] = useState(null); // ✅ tracks which convo is open
  const navigate                  = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/api/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error("Failed to fetch books:", err));
  }, []);

  const location = useLocation();

useEffect(() => {
  if (location.state?.openConvoId) {
    setActiveNav("conversations");
    setActiveChatId(location.state.openConvoId);
  }
}, []);

  return (
    <div className="dashboard-layout">

      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Finder Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          {[
            { key: "discover",       icon: "fas fa-compass",    label: "Discover" },
            { key: "search",         icon: "fas fa-search",     label: "Search History" },
            { key: "wishlist",       icon: "fas fa-heart",      label: "Wishlist" },
            { key: "conversations",  icon: "fas fa-comments",   label: "Conversations" }, // ✅ NEW
            { key: "settings",       icon: "fas fa-cog",        label: "Settings" },
          ].map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => {
                setActiveNav(item.key);
                setActiveChatId(null); // reset chat view when switching tabs
              }}
            >
              <i className={item.icon}></i>
              <span>{item.label}</span>
            </button>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="dashboard-main">

        {/* ── DISCOVER TAB ── */}
        {activeNav === "discover" && (
          <>
            <div className="dashboard-header">
              <h1>Book Finder Dashboard</h1>
              <p>Find your next favorite book from thousands of options.</p>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h2>Recommended For You</h2>
              </div>
              <div className="card-body">
                {books.length === 0 ? (
                  <p>No books available yet.</p>
                ) : (
                  <div className="books-grid-dash">
                    {books.map((book) => (
                      <BookCard
                        key={book._id}
                        _id={book._id}
                        title={book.title}
                        price={book.price}
                        location={book.shopLocation}
                        coverImage={book.coverImage}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {/* ── WISHLIST TAB ── */}
        {activeNav === "wishlist" && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>My Wishlist</h2>
            </div>
            <div className="card-body">
              <WishlistPage />
            </div>
          </div>
        )}

        {/* ── SEARCH HISTORY TAB ── */}
        {activeNav === "search" && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Search History</h2>
            </div>
            <div className="card-body">
              <p style={{ color: "#475569" }}>Search history coming soon.</p>
            </div>
          </div>
        )}

        {/* ── CONVERSATIONS TAB ── */}
        {activeNav === "conversations" && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>💬 Conversations</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {activeChatId ? (
                // Show the chat when a convo is clicked
                <ChatPage
                  id={activeChatId}
                  onBack={() => setActiveChatId(null)}
                />
              ) : (
                // Show the conversations list
                <ConversationList onSelectConvo={(id) => setActiveChatId(id)} />
              )}
            </div>
          </div>
        )}

        {/* ── SETTINGS TAB ── */}
        {activeNav === "settings" && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Settings</h2>
            </div>
            <div className="card-body">
              <p style={{ color: "#475569" }}>Settings coming soon.</p>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
