import { useEffect, useState, useRef } from "react";
import axios from "axios";
import "./ChatPage.css";

// ✅ id and onBack are props — no useParams/useNavigate needed
const ChatPage = ({ id, onBack }) => {
  const [convo, setConvo] = useState(null);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

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

  const handleDelete = async () => {
    if (!window.confirm("Delete this conversation from your end?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/conversations/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onBack();
    } catch (err) {
      console.error(err);
    }
  };

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
            <p className="chat-book-title">📖 {convo.book.title}</p>
          </div>
        </div>
        <button className="chat-delete-btn" onClick={handleDelete} title="Delete conversation">
          🗑️
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
          return (
            <div key={i} className={`chat-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
              <div className={`chat-bubble ${isMine ? "bubble-mine" : "bubble-theirs"}`}>
                <p>{msg.text}</p>
                <span className="chat-time">
                  {new Date(msg.createdAt).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
              </div>
            </div>
          );
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
    </div>
  );
};

export default ChatPage;
