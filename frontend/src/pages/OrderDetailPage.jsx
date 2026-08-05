import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./OrderDetailPage.css";

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  // ── custom modal state ──
  const [modalOpen, setModalOpen] = useState(false);
  const [modalTitle, setModalTitle] = useState("");
  const [modalMessage, setModalMessage] = useState("");
  const [modalConfirmText, setModalConfirmText] = useState("Confirm");
  const [modalCancelText, setModalCancelText] = useState("Cancel");
  const [onConfirm, setOnConfirm] = useState(null);

  // ── toast state ──
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const currentUser = JSON.parse(localStorage.getItem("user") || "null");

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

  // ── helper: show toast ──
  function showToast(message, type = "success") {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  }

  // ── helper: open confirm modal ──
  function openConfirmModal(title, message, confirmText, cancelText, onConfirmFn) {
    setModalTitle(title);
    setModalMessage(message);
    setModalConfirmText(confirmText);
    setModalCancelText(cancelText);
    setOnConfirm(() => onConfirmFn);
    setModalOpen(true);
  }

  function closeModal() {
    setModalOpen(false);
    setOnConfirm(null);
  }

  function handleConfirm() {
    if (onConfirm) onConfirm();
    closeModal();
  }

  // ── ROBUST buyer/seller ID checks ──
  const buyerId = order?.buyer?._id ? order.buyer._id.toString() : order?.buyer?.toString();
  const sellerId = order?.seller?._id ? order.seller._id.toString() : order?.seller?.toString();
  const currentUserId = currentUser?._id?.toString();

  const isBuyerOwner = currentUserId && buyerId === currentUserId;
  const isSellerOwner = currentUserId && sellerId === currentUserId;

  // ── status update (seller) ──
  async function handleStatusChange(e) {
    const newStatus = e.target.value;
    setUpdatingStatus(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/orders/${orderId}/status`,
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder((prev) => ({ ...prev, status: res.data.order.status }));
      showToast("Status updated successfully", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Could not update status.", "error");
    } finally {
      setUpdatingStatus(false);
    }
  }

  // ── cancel order (buyer) ──
  async function handleCancel() {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.put(
        `http://localhost:5000/api/orders/${orderId}/cancel`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrder((prev) => ({ ...prev, status: res.data.order.status }));
      showToast("Order cancelled successfully.", "success");
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Could not cancel order.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  // ── delete order (buyer/seller) ──
  async function handleDelete() {
    setActionLoading(true);
    try {
      const token = localStorage.getItem("token");
      await axios.delete(
        `http://localhost:5000/api/orders/${orderId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      showToast("Order deleted.", "success");
      setTimeout(() => {
        const role = currentUser?.role;
        const basePath = role === "seller" ? "/sellerdashboard" : "/buyerdashboard";
        navigate(`${basePath}?tab=orders`);
      }, 1500);
    } catch (err) {
      console.error(err);
      showToast(err.response?.data?.message || "Could not delete order.", "error");
    } finally {
      setActionLoading(false);
    }
  }

  // ── wrapper: open confirm for cancel ──
  function promptCancel() {
    openConfirmModal(
      "Cancel Order",
      "Are you sure you want to cancel this order?",
      "Yes, Cancel",
      "No, Keep it",
      handleCancel
    );
  }

  // ── wrapper: open confirm for delete ──
  function promptDelete() {
    openConfirmModal(
      "Delete Order",
      "Are you sure you want to permanently delete this order? This action cannot be undone.",
      "Yes, Delete",
      "No, Keep it",
      handleDelete
    );
  }

  // ── handle "on the way" cancel attempt ──
  function handleOnTheWayCancel() {
    showToast("Can't cancel the order. The order is on its way.", "error");
  }

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

  // ── NEW LOGIC for Cancel button ──
  const isCancellable = ["pending", "unavailable", "blocked"].includes(order.status);
  const showCancel = isBuyerOwner && !["delivered", "cancelled"].includes(order.status); // show for pending, on the way, unavailable, blocked
  const showDelete = (isBuyerOwner || isSellerOwner) && ["delivered", "cancelled"].includes(order.status);
  const showStatusDropdown = isSellerOwner && !["delivered", "cancelled"].includes(order.status);

  // Determine cancel button handler and class
  let cancelHandler = null;
  let cancelDisabled = false;
  let cancelButtonClass = "od-btn od-btn-cancel";

  if (isCancellable) {
    cancelHandler = promptCancel;
    cancelButtonClass += " od-btn-cancel-active";
  } else {
    cancelHandler = handleOnTheWayCancel;
    cancelButtonClass += " od-btn-cancel-disabled"; // will apply opacity
  }

  return (
    <div className="od-page">
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
                alt={order.book?.book?.title}
                className="od-cover"
              />
            ) : (
              <div className="od-cover-placeholder">
                <i className="fas fa-book"></i>
              </div>
            )}
            <div className="od-book-info">
              <p className="od-book-title">{order.book?.book?.title}</p>
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
              <span className="od-label">Placed On</span>
              <span className="od-value">
                {new Date(order.createdAt).toLocaleDateString("en-PK", {
                  day: "numeric", month: "long", year: "numeric"
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Order Status */}
        <div className="od-card">
          <h3 className="od-card-title">📦 Order Status</h3>
          <div className="od-status-row">
            {showStatusDropdown ? (
              <select
                className="status-badge badge-blue status-select"
                value={order.status}
                onChange={handleStatusChange}
                disabled={updatingStatus}
              >
                <option value="pending">pending</option>
                <option value="on the way">on the way</option>
                <option value="delivered">delivered</option>
                <option value="unavailable">unavailable</option>
                <option value="blocked">blocked</option>
              </select>
            ) : (
              <span className={`status-badge ${
                order.status === "delivered" ? "badge-green" :
                order.status === "cancelled" ? "badge-red" :
                "badge-blue"
              }`}>
                {order.status}
              </span>
            )}
          </div>
        </div>
      </div> {/* end od-layout */}

      <div className="od-bottom-row">
        <button
          className="od-back"
          onClick={() => {
            const role = currentUser?.role;
            const basePath = role === "seller" ? "/sellerdashboard" : "/buyerdashboard";
            navigate(`${basePath}?tab=orders`);
          }}
        >
          ← Back to Orders
        </button>
        <div className="od-actions">
          {showCancel && (
            <button
              className={cancelButtonClass}
              onClick={cancelHandler}
              disabled={actionLoading}
            >
              <i className="fas fa-times-circle"></i> Cancel Order
            </button>
          )}
          {showDelete && (
            <button
              className="od-btn od-btn-delete"
              onClick={promptDelete}
              disabled={actionLoading}
            >
              <i className="fas fa-trash"></i> Delete Order
            </button>
          )}
        </div>
      </div>

      {/* ── TOAST NOTIFICATION ── */}
      {toast.show && (
        <div className={`od-toast ${toast.type}`}>
          {toast.message}
        </div>
      )}

      {/* ── CUSTOM CONFIRM MODAL ── */}
      {modalOpen && (
        <div className="od-modal-overlay" onClick={closeModal}>
          <div className="od-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="od-modal-title">{modalTitle}</h3>
            <p className="od-modal-message">{modalMessage}</p>
            <div className="od-modal-actions">
              <button className="od-modal-btn od-modal-cancel" onClick={closeModal}>
                {modalCancelText}
              </button>
              <button className="od-modal-btn od-modal-confirm" onClick={handleConfirm}>
                {modalConfirmText}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}