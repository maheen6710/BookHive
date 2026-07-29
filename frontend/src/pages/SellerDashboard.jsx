import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import AddBookForm from "../pages/AddBookForm";
import ConversationList from "../pages/ConversationList";
import ChatPage from "../pages/ChatPage";
import "./Dashboard.css";
import SellerReviews from "../pages/SellerReviews";

export default function SellerDashboard() {
  const [activeNav, setActiveNav] = useState("dashboard");
  const [books, setBooks] = useState([]);
  const [editingBook, setEditingBook] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [editStatus, setEditStatus] = useState("");
  const [activeChatId, setActiveChatId] = useState(null); // ✅ tracks which convo is open
  const [orders, setOrders] = useState([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const navigate = useNavigate();
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem("user"));
  } catch (err) {
    user = null;
  }

  const fetchBooks = async () => {
    if (!user || !user._id) return;
    try {
      const res = await axios.get(
        `http://localhost:5000/api/books/seller/${user._id}`
      );
      setBooks(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchOrders = async () => {
  const token = localStorage.getItem("token");
  try {
        const res = await axios.get("http://localhost:5000/api/orders/seller", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOrders(res.data);
      } catch (err) {
        console.error("Orders fetch failed:", err);
      } finally {
        setOrdersLoading(false);
      }
    };

    useEffect(() => {
      fetchBooks();
      fetchOrders();
    }, []);

  function handleEditClick(book) {
    setEditingBook(book);
    setActiveNav("edit-book");
  }

  async function handleDelete(bookId) {
    const confirmed = window.confirm("Are you sure you want to delete this book?");
    if (!confirmed) return;

    const token = localStorage.getItem("token");
    try {
      await axios.delete(`http://localhost:5000/api/books/${bookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      fetchBooks();
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  function handleCloseModal() {
    setEditingBook(null);
    setEditForm({});
    setEditStatus("");
  }

  function handleEditChange(e) {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  }

  async function handleEditSubmit(e) {
    e.preventDefault();
    setEditStatus("loading");
    try {
      await axios.put(
        `http://localhost:5000/api/books/${editingBook._id}`,
        editForm
      );
      setEditStatus("success");
      await fetchBooks();
      setTimeout(() => {
        handleCloseModal();
      }, 1000);
    } catch (err) {
      console.error(err);
      setEditStatus("error");
    }
  }

  function renderContent() {
    switch (activeNav) {
      case "add-book":
        return (
          <AddBookForm onBookAdded={() => {
            setActiveNav("dashboard");
            fetchBooks();
          }} />
        );

      case "edit-book":
        return (
          <AddBookForm
            bookToEdit={editingBook}
            onBookAdded={() => {
              setEditingBook(null);
              setActiveNav("dashboard");
              fetchBooks();
            }}
          />
        );

      // ✅ CONVERSATIONS TAB
      case "conversations":
        return (
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
        );
         case "reviews":
        return <SellerReviews />;


      case "orders":
  return (
    <div className="dashboard-card">
      <div className="card-header">
        <h2>📦 Incoming Orders</h2>
      </div>
      <div className="card-body">
        {ordersLoading ? (
          <p className="orders-empty">Loading orders...</p>
        ) : orders.length === 0 ? (
          <p className="orders-empty">No orders yet 📭</p>
        ) : (
          <table className="data-table">
            <thead>
              <tr>
                <th>Book</th>
                <th>Buyer</th>
                <th>Phone</th>
                <th>Address</th>
                <th>Total</th>
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
                        <p className="book-cat">Rs. {order.book?.price}</p>
                      </div>
                    </div>
                  </td>
                  <td className="order-buyer">{order.buyer?.name || "N/A"}</td>
                  <td>{order.buyerDetails?.phone}</td>
                  <td className="order-address">{order.buyerDetails?.address}</td>
                  <td className="order-price">Rs. {order.totalPrice}</td>
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
  );

      case "dashboard":
      default:
        return (
          <>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon icon-blue">
                  <i className="fas fa-book"></i>
                </div>
                <div>
                  <p>Total Books</p>
                  <h3>{books.length}</h3>
                </div>
              </div>
            </div>

            <div className="dashboard-card">
              <div className="card-header">
                <h2>Your Books</h2>
              </div>

              <div className="card-body">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Book</th>
                      <th>Price</th>
                      <th>Status</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {books.length > 0 ? (
                      books.map((book) => (
                        <tr key={book._id}>
                          <td>
                            <div className="table-book">
                              <img
                                src={
                                  book.coverImage
                                    ? `http://localhost:5000${book.coverImage}`
                                    : "/placeholder.png"
                                }
                                alt={book.book?.title}
                                className="book-thumb"
                              />
                              <div>
                                <p className="book-name">{book.book?.title}</p>
                                <p className="book-cat">{book.condition}</p>
                              </div>
                            </div>
                          </td>

                          <td>Rs. {book.price}</td>

                          <td>
                            <span className="status-badge badge-green">
                              Active
                            </span>
                          </td>

                          <td>
                            <div className="action-btns">
                              <button
                                className="btn-edit"
                                onClick={() => handleEditClick(book)}
                              >
                                <i className="fas fa-pencil-alt"></i> Edit
                              </button>
                              <button
                                className="btn-edit"
                                onClick={() => handleDelete(book._id)}
                              >
                                <i className="fas fa-trash"></i> Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="4">No books added yet 😢</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        );
    }
  }

  return (
    <div className="dashboard-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>Seller Dashboard</h2>
        </div>
        <nav className="sidebar-nav">
          {[
            { key: "dashboard",     icon: "fas fa-tachometer-alt", label: "Dashboard" },
            { key: "add-book",      icon: "fas fa-plus-circle",    label: "Add New Book" },
            { key: "orders",        icon: "fas fa-box",            label: "Orders" },
            { key: "conversations", icon: "fas fa-comments",       label: "Conversations" }, 
            { key: "reviews",       icon: "fas fa-star",           label: "Reviews" },
            { key: "view-profile",  icon: "fas fa-user-circle",    label: "View Profile" },
          ].map((item) => (
            <button
              key={item.key}
              className={`nav-item ${activeNav === item.key ? "active" : ""}`}
              onClick={() => {
                if (item.key === "view-profile") {
                  navigate(`/seller/${user?._id}`);
                  return;
                }
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

      <div className="dashboard-main">
        <div className="dashboard-header">
          <h1>Welcome, {user?.name}</h1>
          <p>Role: {user?.role}</p>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}
