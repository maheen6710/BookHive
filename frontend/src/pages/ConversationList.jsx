import { useEffect, useState } from "react";
import axios from "axios";
import "./ConversationList.css";

// ✅ onSelectConvo prop — called when user clicks a convo row
const ConversationList = ({ onSelectConvo }) => {
  const [convos, setConvos] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleDelete = async (e, convoId) => {
    e.stopPropagation();
    if (!window.confirm("Remove this conversation from your inbox?")) return;
    try {
      const token = localStorage.getItem("token");
      await axios.delete(`http://localhost:5000/api/conversations/${convoId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setConvos((prev) => prev.filter((c) => c._id !== convoId));
    } catch (err) {
      console.error(err);
    }
  };

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
                <div className="cl-avatar">{otherUser.name?.[0]?.toUpperCase() || "?"}</div>
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
                  🗑️
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ConversationList;
