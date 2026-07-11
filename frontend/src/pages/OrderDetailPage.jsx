import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./OrderDetailPage.css";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate    = useNavigate();
  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchOrder() {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(
          `http://localhost:5000/api/orders/${orderId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setOrder(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchOrder();
  }, [orderId]);

  if (loading) return (
    <div className="od-loading">
      <div className="od-spinner"></div>
      <p>Loading order...</p>
    </div>
  );

  if (!order) return (
    <div className="od-notfound">
      <h2>Order not found.</h2>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="od-page">
      <button className="od-back" onClick={() => navigate(-1)}>
        ← Back to Orders
      </button>

      <h2 className="od-heading">
        <i className="fas fa-box-open"></i> Order Details
      </h2>

      <div className="od-layout">

        {/* Book Info */}
        <div className="od-card">
          <h3 className="od-card-title">📚 Book</h3>
          <div className="od-book-row">
            {order.book?.coverImage ? (
              <img
                src={`http://localhost:5000${order.book.coverImage}`}
                alt={order.book.title}
                className="od-cover"
              />
            ) : (
              <div className="od-cover-placeholder">
                <i className="fas fa-book"></i>
              </div>
            )}
            <div className="od-book-info">
              <p className="od-book-title">{order.book?.title}</p>
              <p className="od-book-price">Rs. {order.book?.price}</p>
            </div>
          </div>
        </div>

        {/* Buyer Info */}
        <div className="od-card">
          <h3 className="od-card-title">👤 Buyer Details</h3>
          <div className="od-info-grid">
            <div className="od-info-item">
              <span className="od-label">Name</span>
              <span className="od-value">{order.buyerDetails?.name}</span>
            </div>
            <div className="od-info-item">
              <span className="od-label">Phone</span>
              <span className="od-value">{order.buyerDetails?.phone}</span>
            </div>
            <div className="od-info-item">
              <span className="od-label">Address</span>
              <span className="od-value">{order.buyerDetails?.address}</span>
            </div>
            <div className="od-info-item">
              <span className="od-label">Payment</span>
              <span className="od-value">{order.paymentMethod}</span>
            </div>
          </div>
        </div>

        {/* Order Meta */}
        <div className="od-card">
          <h3 className="od-card-title">🧾 Order Info</h3>
          <div className="od-info-grid">
            <div className="od-info-item">
              <span className="od-label">Order ID</span>
              <span className="od-value od-id">{order._id}</span>
            </div>
            <div className="od-info-item">
              <span className="od-label">Total</span>
              <span className="od-value od-price">Rs. {order.totalPrice}</span>
            </div>
            <div className="od-info-item">
              <span className="od-label">Status</span>
              <span className={`status-badge ${
                order.status === "confirmed" ? "badge-green"
                : order.status === "cancelled" ? "badge-red"
                : "badge-blue"
              }`}>
                {order.status}
              </span>
            </div>
            <div className="od-info-item">
              <span className="od-label">Placed On</span>
              <span className="od-value">
                {new Date(order.createdAt).toLocaleDateString("en-PK", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}