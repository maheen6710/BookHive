import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom"; // changed
import BookCard from "../components/BookCard";
import WishlistPage from "./WishlistPage";
import ConversationList from "../pages/ConversationList";
import ChatPage from "../pages/ChatPage";
import Settings from "./Settings";
import SearchHistoryPage from "./SearchHistoryPage";
import "./Dashboard.css";

export default function BuyerDashboard() {
  const [activeNav, setActiveNav] = useState("discover");
  const [books, setBooks] = useState([]);
  const [activeChatId, setActiveChatId] = useState(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams(); // new

  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  // Read tab from URL query params
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab === "orders") setActiveNav("orders");
    if (tab === "conversations") {
      setActiveNav("conversations");
      const convoId = searchParams.get("convo");
      if (convoId) setActiveChatId(convoId);
    }
    // if tab is not set, default to "discover" (already the default)
  }, [searchParams]);

  // Fetch books (same as before)
  useEffect(() => {
    fetch("http://localhost:5000/api/books")
      .then((res) => res.json())
      .then((data) => setBooks(data))
      .catch((err) => console.error("Failed to fetch books:", err));
  }, []);

  // Fetch orders (same as before)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      fetch("http://localhost:5000/api/orders/my", {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => res.json())
        .then((data) => { setOrders(data); setOrdersLoading(false); })
        .catch((err) => { console.error("Orders fetch failed:", err); setOrdersLoading(false); });
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
            { key: "orders",         icon: "fas fa-box",        label: "My Orders"      },
            { key: "wishlist",       icon: "fas fa-heart",      label: "Wishlist" },
            { key: "conversations",  icon: "fas fa-comments",   label: "Conversations" }, 
            { key: "settings",       icon: "fas fa-cog",        label: "Settings" },
          ].map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => {
                setActiveNav(item.key);
                setActiveChatId(null);
                // Optionally update URL when user clicks tab (optional)
                navigate(`?tab=${item.key}`);
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
                    {books.map((listing) => (
                      <BookCard
                        key={listing._id}
                        _id={listing._id}
                        title={listing.book?.title}
                        price={listing.price}
                        location={listing.shopLocation}
                        coverImage={listing.coverImage}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </>
        )}

        {activeNav === "orders" && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>📦 My Orders</h2>
            </div>
            <div className="card-body">
              {ordersLoading ? (
                <p className="orders-empty">Loading orders...</p>
              ) : orders.length === 0 ? (
                <p className="orders-empty">You haven't placed any orders yet 📭</p>
              ) : (
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Total</th>
                      <th>Payment</th>
                      <th>Status</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr
                        key={order._id}
                        className="order-row"
                        onClick={() => navigate(`/order/${order._id}`)}
                      >
                        <td>
                          <div className="table-book">
                            {order.book?.coverImage ? (
                              <img
                                src={`http://localhost:5000${order.book.coverImage}`}
                                alt={order.book?.book?.title}
                                className="book-thumb"
                              />
                            ) : (
                              <div className="book-thumb-placeholder">
                                <i className="fas fa-book"></i>
                              </div>
                            )}
                            <div>
                              <p className="book-name">{order.book?.book?.title || "N/A"}</p>
                              <p className="book-cat">
                                Seller: {order.seller?.name || "N/A"}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="order-price">Rs. {order.totalPrice}</td>
                        <td style={{ color: "#94a3b8", fontSize: "0.85rem" }}>
                          {order.paymentMethod}
                        </td>
                        <td>
                          <span className={`status-badge ${
                            order.status === "confirmed" ? "badge-green"
                            : order.status === "cancelled" ? "badge-red"
                            : "badge-blue"
                          }`}>
                            {order.status}
                          </span>
                        </td>
                        <td className="order-date">
                          {new Date(order.createdAt).toLocaleDateString("en-PK", {
                            day: "numeric", month: "short", year: "numeric"
                          })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

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

        {activeNav === "search" && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>Search History</h2>
            </div>
            <div className="card-body">
              <SearchHistoryPage />
            </div>
          </div>
        )}

        {activeNav === "conversations" && (
          <div className="dashboard-card">
            <div className="card-header">
              <h2>💬 Conversations</h2>
            </div>
            <div className="card-body" style={{ padding: 0 }}>
              {activeChatId ? (
                <ChatPage
                  id={activeChatId}
                  onBack={() => {
                    setActiveChatId(null);
                    navigate(`?tab=conversations`);
                  }}
                />
              ) : (
                <ConversationList 
                  onSelectConvo={(id) => {
                    setActiveChatId(id);
                    navigate(`?tab=conversations&convo=${id}`);
                  }} 
                />
              )}
            </div>
          </div>
        )}

        {activeNav === "settings" && <Settings />}
      </div>
    </div>
  );
}