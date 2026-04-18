import React from "react";

export default function MessageItem({ message, currentUserId, isDirect = false }) {
  const isMine = message.senderUserId === currentUserId;
  const senderName = message.sender?.name || "Unknown";
  const initials = senderName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";

  return (
    <div className={`message-row ${isMine ? "mine" : "theirs"}`}>
      {!isMine ? <span className="message-avatar">{initials}</span> : null}

      <div className={`message-item ${isMine ? "mine" : ""}`}>
        {!isMine && !isDirect ? <strong>{senderName}</strong> : null}
        <p>{message.body}</p>
        <small>{new Date(message.createdAt).toLocaleString()}</small>
      </div>

      {isMine ? <span className="message-avatar mine">{initials}</span> : null}
    </div>
  );
}
