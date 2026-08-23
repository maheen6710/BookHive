import "./Message.css";

const Message = ({ msg, isMine }) => {
  return (
    <div className={`chat-bubble-wrap ${isMine ? "mine" : "theirs"}`}>
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
};

export default Message;
