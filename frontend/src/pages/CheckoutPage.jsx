import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./CheckoutPage.css";

export default function CheckoutPage() {
  const { bookId }  = useParams();
  const navigate    = useNavigate();
  const [book, setBook]       = useState(null); 
  const [loading, setLoading] = useState(true);
  const [placing, setPlacing] = useState(false);
  const [message, setMessage] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const currentUser = JSON.parse(localStorage.getItem("user"));
  const [form, setForm] = useState({
    name:    currentUser?.name || "",
    phone:   "",
    address: "",
    paymentMethod: "COD",
  });

  useEffect(() => {
    async function fetchBook() {
      try {
        const res = await axios.get(`http://localhost:5000/api/books/${bookId}`);
        setBook(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    fetchBook();
  }, [bookId]);

  function handleChange(e) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  }

  async function handleConfirmOrder() {
    const token = localStorage.getItem("token");
    if (!token) {
       navigate("/login", { state: { from: `/checkout/${bookId}` } });
        return; 
      }
    if (!form.name || !form.phone || !form.address) {
      setMessage("⚠️ Please fill in all fields."); return;
    }

    try {
      setPlacing(true);
      await axios.post(
        "http://localhost:5000/api/orders",
        {
          bookId,
          sellerId:      book.seller?._id || book.seller,
          buyerDetails:  {
            name:    form.name,
            phone:   form.phone,
            address: form.address,
          },
          paymentMethod: form.paymentMethod,
          totalPrice:    book.price,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      navigate("/order-success");

    } catch (err) {
      setMessage(err.response?.data?.message || "❌ Something went wrong.");
    } finally {
      setPlacing(false);
    }
  }

  if (loading) return (
    <div className="co-loading">
      <div className="co-spinner"></div>
      <p>Loading checkout...</p>
    </div>
  );

  if (!book) return (
    <div className="co-notfound">
      <h2>Book not found.</h2>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  return (
    <div className="co-page">
      <h2 className="co-heading"><i className="fas fa-shopping-bag"></i> Checkout</h2>

      <div className="co-layout">

        {/* LEFT — Order Summary */}
        <div className="co-summary">
          <h3 className="co-section-title">Order Summary</h3>

          <div className="co-book-card">
            {book.coverImage ? (
              <img
                src={`http://localhost:5000${book.coverImage}`}
                alt={book.book?.title}
                className="co-book-cover"
              />
            ) : (
              <div className="co-cover-placeholder">
                <i className="fas fa-book"></i>
              </div>
            )}

            <div className="co-book-info">
              <p className="co-book-title">{book.book?.title}</p>
              <p className="co-book-author">by {book.book?.author}</p>
              <p className="co-book-condition">Condition: <span>{book.condition}</span></p>
              <p className="co-book-seller">
                Seller: <span>{book.seller?.name || "Unknown"}</span>
              </p>
            </div>
          </div>

          <div className="co-price-row">
            <span>Total</span>
            <span className="co-price">Rs. {book.price}</span>
          </div>
        </div>

        <div className="co-form">
          <h3 className="co-section-title">Delivery Details</h3>

          <div className="co-field">
            <label>Full Name</label>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Your full name"
            />
          </div>

          <div className="co-field">
            <label>Phone Number</label>
            <input
              type="tel"
              name="phone"
              value={form.phone}
              onChange={(e) => {
                const raw = e.target.value;
                if (/[^0-9]/.test(raw)) {
                  setPhoneError("No alphabets or special characters allowed!");
                } else {
                  setPhoneError("");
                }
                const val = raw.replace(/\D/g, "");
                if (val.length <= 11) setForm((prev) => ({ ...prev, phone: val }));
              }}
              placeholder="03XXXXXXXXX"
              maxLength={11}
          />
          {phoneError && <p className="co-phone-error">{phoneError}</p>}
          </div>

          <div className="co-field">
            <label>Delivery Address</label>
            <textarea
              name="address"
              value={form.address}
              onChange={handleChange}
              placeholder="Street, City, Province"
              rows={3}
            />
          </div>

          <div className="co-field">
            <label>Payment Method</label>
            <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange}>
              <option value="COD">Cash on Delivery</option>
            </select>
          </div>

          {message && <p className="co-message">{message}</p>}

          <button
            className="co-btn-confirm"
            onClick={handleConfirmOrder}
            disabled={placing}
          >
            <i className="fas fa-check-circle"></i>
            {placing ? "Placing Order..." : "Confirm Order"}
          </button>

          <button className="co-btn-back" onClick={() => navigate(-1)}>
            ← Go Back
          </button>
        </div>

      </div>
    </div>
  );
}
