import React from "react";
import MessageItem from "./MessageItem";

export default function ChatBox({ messages = [], currentUserId }) {
  return (
    <div className="message-feed">
      {messages.map((message) => (
        <MessageItem key={message.id} message={message} currentUserId={currentUserId} />
      ))}
      {!messages.length ? <p>No messages yet.</p> : null}
    </div>
  );
}
