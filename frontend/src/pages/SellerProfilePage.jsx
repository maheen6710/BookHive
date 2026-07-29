import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import "./SellerProfilePage.css";
import ReviewList from "../components/ReviewList";
import ImageCropper from "../components/ImageCropper";

export default function SellerProfilePage() {
  const { sellerId } = useParams();
  const navigate     = useNavigate();

  const [seller, setSeller]         = useState(null);
  const [books, setBooks]           = useState([]); // array of LISTINGS now
  const [reviews, setReviews]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [notFound, setNotFound]     = useState(false);
  const [chatMessage, setChatMessage] = useState("");

  // ── owner / edit state ──
  const currentUser = JSON.parse(localStorage.getItem("user") || "null");
  const isOwner = currentUser?._id === sellerId;
  const [editingField, setEditingField] = useState(null); // "name" | "shopName" | "shopAddress" | "location" | null
  const [fieldValue, setFieldValue]     = useState("");
  const [saving, setSaving]             = useState(false);
  const [rawImageSrc, setRawImageSrc]   = useState(null); // controls cropper visibility
  const fileInputRef = useRef(null);

  useEffect(() => {
    async function fetchSellerData() {
      try {
        const [sellerRes, booksRes] = await Promise.all([
          axios.get(`http://localhost:5000/api/users/${sellerId}`),
          axios.get(`http://localhost:5000/api/books/seller/${sellerId}`),
        ]);
        setSeller(sellerRes.data);
        setBooks(booksRes.data);

        // fetch reviews for all seller's listings in parallel
        const listingIds = booksRes.data.map((b) => b._id);
        const reviewRequests = listingIds.map((id) =>
          axios.get(`http://localhost:5000/api/reviews/${id}`)
        );
        const reviewResults = await Promise.all(reviewRequests);
        const allReviews = reviewResults.flatMap((r) => r.data);
        setReviews(allReviews);

      } catch (err) {
        setNotFound(true);
      } finally {
        setLoading(false);
        setReviewsLoading(false);
      }
    }
    fetchSellerData();
  }, [sellerId]);

  function conditionBadgeClass(c) {
    return { "new": "badge-new", "like-new": "badge-likenew", "good": "badge-good", "fair": "badge-fair" }[c] || "";
  }

  function showMessage(msg) {
    setChatMessage(msg);
    setTimeout(() => setChatMessage(""), 3000);
  }

  async function handleChatWithSeller() {
    const token = localStorage.getItem("token");
    const user  = JSON.parse(localStorage.getItem("user"));

    if (!token || !user) {
      navigate("/login", { state: { from: `/seller/${sellerId}` } });
      return;
    }

    if (user._id === sellerId) {
      showMessage("This is your own profile!");
      return;
    }

    try {
      const { data } = await axios.post(
        "http://localhost:5000/api/conversations/start",
        { sellerId }, // general seller inquiry, no bookId
        { headers: { Authorization: `Bearer ${token}` } }
      );
      navigate("/buyerdashboard", { state: { openConvoId: data._id } });
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.message || "Could not start conversation.");
    }
  }

  // ── owner edit handlers ──
  function startEdit(field, currentValue) {
    setEditingField(field);
    setFieldValue(currentValue || "");
  }

  function cancelEdit() {
    setEditingField(null);
    setFieldValue("");
  }

  async function saveField(field) {
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append(field, fieldValue);

      const res = await axios.put(
        "http://localhost:5000/api/users/me",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSeller(res.data.user);
      const storedUser = JSON.parse(localStorage.getItem("user"));
      localStorage.setItem("user", JSON.stringify({ ...storedUser, [field]: fieldValue }));

      showMessage("✅ Updated!");
      cancelEdit();
    } catch (err) {
      console.error(err);
      showMessage(err.response?.data?.message || "❌ Update failed.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePicChange(e) {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showMessage("Please select a valid image file.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage("Image must be under 5MB.");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setRawImageSrc(reader.result); // opens the cropper
    };
    reader.readAsDataURL(file);

    e.target.value = ""; // allow re-selecting the same file later
  }

  async function handlePicCropComplete(croppedFile) {
    setRawImageSrc(null);
    setSaving(true);
    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("profileImage", croppedFile);

      const res = await axios.put(
        "http://localhost:5000/api/users/me",
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      setSeller(res.data.user);
      showMessage("✅ Profile picture updated!");
    } catch (err) {
      console.error(err);
      showMessage("❌ Failed to update picture.");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return (
    <div className="spp-loading">
      <div className="spp-spinner"></div>
      <p>Loading seller profile...</p>
    </div>
  );

  if (notFound) return (
    <div className="spp-notfound">
      <i className="fas fa-user-slash"></i>
      <h2>Seller not found</h2>
      <button onClick={() => navigate(-1)}>Go Back</button>
    </div>
  );

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  // small reusable inline-edit renderer for text fields
  function EditableField({ field, value, icon }) {
    if (editingField === field) {
      return (
        <div className="spp-meta-item spp-meta-editing">
          <i className={icon}></i>
          <input
            type="text"
            value={fieldValue}
            onChange={(e) => setFieldValue(e.target.value)}
            autoFocus
            className="spp-inline-input"
          />
          <button className="spp-inline-btn spp-inline-save" onClick={() => saveField(field)} disabled={saving}>
            <i className="fas fa-check"></i>
          </button>
          <button className="spp-inline-btn spp-inline-cancel" onClick={cancelEdit}>
            <i className="fas fa-times"></i>
          </button>
        </div>
      );
    }
    return (
      <div className="spp-meta-item">
        <i className={icon}></i>
        <span>{value || "—"}</span>
        {isOwner && (
          <button className="spp-pencil" onClick={() => startEdit(field, value)}>
            <i className="fas fa-pencil-alt"></i>
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="spp-page">
      <div className="spp-layout">

        {/* ── LEFT: seller info card ── */}
        <aside className="spp-sidebar">

          <div className="spp-avatar-wrap">
            <div className="spp-avatar">
              {seller.profileImage ? (
                <img src={`http://localhost:5000${seller.profileImage}`} alt={seller.name} />
              ) : (
                <i className="fas fa-user"></i>
              )}
            </div>
            {isOwner && (
              <>
                <button
                  className="spp-avatar-pencil"
                  onClick={() => fileInputRef.current?.click()}
                  title="Change profile picture"
                >
                  <i className="fas fa-pencil-alt"></i>
                </button>
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  style={{ display: "none" }}
                  onChange={handlePicChange}
                />
              </>
            )}
            <span className="spp-verified"><i className="fas fa-store"></i> Seller</span>
          </div>

          {/* Name — editable if owner */}
          {editingField === "name" ? (
            <div className="spp-name-edit">
              <input
                type="text"
                value={fieldValue}
                onChange={(e) => setFieldValue(e.target.value)}
                autoFocus
                className="spp-inline-input"
              />
              <button className="spp-inline-btn spp-inline-save" onClick={() => saveField("name")} disabled={saving}>
                <i className="fas fa-check"></i>
              </button>
              <button className="spp-inline-btn spp-inline-cancel" onClick={cancelEdit}>
                <i className="fas fa-times"></i>
              </button>
            </div>
          ) : (
            <h2 className="spp-name">
              {seller.name}
              {isOwner && (
                <button className="spp-pencil" onClick={() => startEdit("name", seller.name)}>
                  <i className="fas fa-pencil-alt"></i>
                </button>
              )}
            </h2>
          )}

          <div className="spp-meta-list">
            <EditableField field="location"    value={seller.location}    icon="fas fa-map-marker-alt" />
            <EditableField field="shopName"    value={seller.shopName}    icon="fas fa-store" />
            <EditableField field="shopAddress" value={seller.shopAddress} icon="fas fa-map-pin" />

            <div className="spp-meta-item">
              <i className="fas fa-book"></i>
              <span>{books.length} book{books.length !== 1 ? "s" : ""} listed</span>
            </div>
          </div>

          {/* rating summary — only show if real reviews exist */}
          {avgRating && (
            <div className="spp-rating-box">
              <span className="spp-avg">{avgRating}</span>
              <div>
                <div className="spp-stars">
                  {[1,2,3,4,5].map(s => (
                    <i key={s} className={`fas fa-star ${s <= Math.round(avgRating) ? "star-filled" : "star-empty"}`}></i>
                  ))}
                </div>
                <span className="spp-review-count">{reviews.length} review{reviews.length !== 1 ? "s" : ""}</span>
              </div>
            </div>
          )}

          {/* only show chat button to non-owners */}
          {!isOwner && (
            <button className="spp-chat-btn" onClick={handleChatWithSeller}>
              <i className="fas fa-comment-dots"></i> Chat with Seller
            </button>
          )}

        </aside>

        {/* ── RIGHT: books + reviews ── */}
        <div className="spp-main">

          {/* listed books */}
          <section className="spp-section">
            <h3 className="spp-section-title">
              <i className="fas fa-book-open"></i> Listed Books
            </h3>

            {books.length === 0 ? (
              <p className="spp-none">This seller hasn't listed any books yet.</p>
            ) : (
              <div className="spp-books-grid">
                {books.map((listing) => (
                  <div
                    key={listing._id}
                    className="spp-book-card"
                    onClick={() => navigate(`/book/${listing._id}`)}
                  >
                    <div className="spp-book-cover">
                      {listing.coverImage ? (
                        <img src={`http://localhost:5000${listing.coverImage}`} alt={listing.book?.title} />
                      ) : (
                        <div className="spp-cover-placeholder">
                          <i className="fas fa-book"></i>
                        </div>
                      )}
                      <span className={`spp-condition ${conditionBadgeClass(listing.condition)}`}>
                        {listing.condition}
                      </span>
                    </div>
                    <div className="spp-book-info">
                      <p className="spp-book-title">{listing.book?.title}</p>
                      <p className="spp-book-author">by {listing.book?.author}</p>
                      {listing.book?.category && (
                        <span className="spp-book-cat">
                          <i className="fas fa-tag"></i> {listing.book.category}
                        </span>
                      )}
                      <p className="spp-book-price">Rs. {listing.price}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* reviews — real data, no dummy */}
          <section className="spp-section">
            <h3 className="spp-section-title">
              <i className="fas fa-star"></i> Reviews
            </h3>
            <ReviewList reviews={reviews} loading={reviewsLoading} />
          </section>

        </div>
      </div>

      {chatMessage && (
        <div className="spp-toast">{chatMessage}</div>
      )}

      <ImageCropper
        rawImageSrc={rawImageSrc}
        aspect={1}
        outputFileName="profile.jpg"
        title="Crop Profile Picture"
        subtitle="Drag to adjust. Profile pictures are cropped to a circle."
        onCropComplete={handlePicCropComplete}
        onCancel={() => setRawImageSrc(null)}
      />
    </div>
  );
}
