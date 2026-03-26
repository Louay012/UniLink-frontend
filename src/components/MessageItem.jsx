import React from "react";

export default function MessageItem({ message, currentUserId }) {
  const isMine = message.senderUserId === currentUserId;

  return (
    <div className={`message-item ${isMine ? "mine" : ""}`}>
      <strong>{message.sender?.name || "Unknown"}</strong>
      <p>{message.body}</p>
      <small>{new Date(message.createdAt).toLocaleString()}</small>
    </div>
  );
}
