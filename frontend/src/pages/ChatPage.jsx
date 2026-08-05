import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { FaTrashAlt } from "react-icons/fa";
import Message from "../components/Message";
import "./ChatPage.css";

const ChatPage = ({ id, onBack }) => {
  const [convo, setConvo] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  // ── modal & toast state ──
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "" });

  const currentUser = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    fetchConversation();
  }, [id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [convo?.messages]);

  const fetchConversation = async () => {
    try {
      const token = localStorage.getItem("token");
      const { data } = await axios.get(`http://localhost:5000/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConvo(data);
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

  function openDeleteModal() {
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      showToast("Conversation deleted");
      setDeleteModalOpen(false);
      onBack();
    } catch (err) {
      console.error(err);
      showToast("Failed to delete conversation");
      setDeleteModalOpen(false);
    }
  }

  function closeDeleteModal() {
    setDeleteModalOpen(false);
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    try {
      const token = localStorage.getItem("token");
      const { data: newMsg } = await axios.post(
        `http://localhost:5000/api/conversations/${id}/message`,
        { text },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setConvo((prev) => ({
        ...prev,
        messages: [
          ...prev.messages,
          { ...newMsg, sender: { _id: currentUser._id, name: currentUser.name } },
        ],
      }));
      setText("");
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  };

  // ── NO window.confirm here ──
  const handleDelete = openDeleteModal;

  if (loading) return <div className="chat-loading">Loading conversation...</div>;
  if (!convo) return <div className="chat-loading">Conversation not found.</div>;

  const otherUser =
    currentUser._id === convo.buyer._id ? convo.seller : convo.buyer;

  return (
    <div className="chat-page">
      <div className="chat-header">
        <button className="chat-back-btn" onClick={onBack}>
          ← Back
        </button>
        <div className="chat-header-info">
          <div className="chat-avatar">{otherUser.name[0].toUpperCase()}</div>
          <div>
            <p className="chat-other-name">{otherUser.name}</p>
            {convo.book?.book?.title && (
              <p className="chat-book-title">📖 {convo.book.book.title}</p>
            )}
          </div>
        </div>
        <button className="chat-delete-btn" onClick={handleDelete} title="Delete conversation">
          <FaTrashAlt className="chat-delete-icon" />
        </button>
      </div>

      <div className="chat-messages">
        {convo.messages.length === 0 && (
          <p className="chat-empty">No messages yet. Say hi! 👋</p>
        )}
        {convo.messages.map((msg, i) => {
          const isMine =
            msg.sender._id === currentUser._id ||
            msg.sender === currentUser._id;
          return <Message key={i} msg={msg} isMine={isMine} />;
        })}
        <div ref={bottomRef} />
      </div>

      <form className="chat-input-area" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="chat-input"
          disabled={sending}
        />
        <button type="submit" className="chat-send-btn" disabled={sending}>
          {sending ? "..." : "Send"}
        </button>
      </form>

      {/* ── TOAST ── */}
      {toast.show && (
        <div className="chat-toast">{toast.message}</div>
      )}

      {/* ── DELETE MODAL ── */}
      {deleteModalOpen && (
        <div className="chat-modal-overlay" onClick={closeDeleteModal}>
          <div className="chat-modal" onClick={(e) => e.stopPropagation()}>
            <h3 className="chat-modal-title">Delete Conversation</h3>
            <p className="chat-modal-message">
              Are you sure you want to delete this conversation from your end?
            </p>
            <div className="chat-modal-actions">
              <button className="chat-modal-btn chat-modal-cancel" onClick={closeDeleteModal}>
                Cancel
              </button>
              <button className="chat-modal-btn chat-modal-confirm" onClick={confirmDelete}>
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatPage;