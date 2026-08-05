import { useEffect, useState } from "react";
import axios from "axios";
import { FaTrashAlt } from "react-icons/fa";
import "./ConversationList.css";

// ✅ onSelectConvo prop — called when user clicks a convo row
const ConversationList = ({ onSelectConvo }) => {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

  // ── modal & toast state ──
  const [deleteTarget, setDeleteTarget] = useState(null); // convoId pending deletion
  const [toast, setToast] = useState({ show: false, message: "" });

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchConvos();
  }, []);

  const fetchConvos = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get("http://localhost:5000/api/conversations", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConvos(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  function showToast(message) {
    setToast({ show: true, message });
    setTimeout(() => setToast({ show: false, message: "" }), 3000);
  }

  // ── opens modal instead of window.confirm ──
  const handleDelete = (e, convoId) => {
    e.stopPropagation();
    setDeleteTarget(convoId);
  };

  function closeDeleteModal() {
    setDeleteTarget(null);
  }

  async function confirmDelete() {
    const convoId = deleteTarget;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/conversations/${convoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConvos((prev) => prev.filter((c) => c._id !== convoId));
      showToast("Conversation removed");
    } catch (err) {
      console.error(err);
      showToast("Failed to remove conversation");
    } finally {
      setDeleteTarget(null);
    }
  }

  if (loading) return <div className="cl-loading">Loading messages...</div>;

  return (
    <div className="cl-page">
      {convos.length === 0 ? (
        <div className="cl-empty">
          <span>📭</span>
          <p>No conversations yet.</p>
        </div>
      ) : (
        <div className="cl-list">
          {convos.map((convo) => {
            // 🔥 guard against missing/deleted buyer or seller so it never crashes
            if (!convo.buyer || !convo.seller) return null;

            const isBuyer = convo.buyer._id === currentUser._id;
            const otherUser = isBuyer ? convo.seller : convo.buyer;
            const lastMsg = convo.messages[convo.messages.length - 1];

            return (
              <div
                key={convo._id}
                className="cl-item"
                onClick={() => onSelectConvo(convo._id)} // ✅ uses prop instead of navigate
              >
                <div className="cl-avatar">
                  {otherUser.profileImage ? (
                    <img
                      src={`http://localhost:5000${otherUser.profileImage}`}
                      alt={otherUser.name}
                      className="cl-avatar-img"
                    />
                  ) : (
                    otherUser.name?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <div className="cl-info">
                  <div className="cl-top-row">
                    <span className="cl-name">{otherUser.name}</span>
                    {lastMsg && (
                      <span className="cl-time">
                        {new Date(lastMsg.createdAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <p className="cl-book">
                    {convo.book?.book?.title
                      ? `📖 ${convo.book.book.title}`
                      : "💬 General inquiry"}
                  </p>
                  {lastMsg && (
                    <p className="cl-last-msg">{lastMsg.text}</p>
                  )}
                </div>
                <button
                  className="cl-delete-btn"
                  onClick={(e) => handleDelete(e, convo._id)}
                  title="Delete"
                >
                  <FaTrashAlt className="cl-delete-icon" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* ── TOAST ── */}
      {toast.show && <div className="cl-toast">{toast.message}</div>}

      {/* ── DELETE MODAL ── */}
      {deleteTarget && (
        <div className="cl-modal-overlay" onClick={closeDeleteModal}>
          <div className="cl-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="cl-modal-title">Remove Conversation</h3>
            <p className="cl-modal-message">
              Remove this conversation from your inbox? This action cannot be undone.
            </p>
            <div className="cl-modal-actions">
              <button className="cl-modal-btn cl-modal-cancel" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="cl-modal-btn cl-modal-confirm" onClick={confirmDelete}>
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversationList;
