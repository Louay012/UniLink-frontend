import React, { useEffect, useRef } from "react";
import MessageItem from "./MessageItem";

export default function ChatBox({ messages = [], currentUserId, isDirect = false }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages]);

  return (
    <div className="message-feed">
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          isDirect={isDirect}
        />
      ))}
      {!messages.length ? <p className="message-empty">No messages yet.</p> : null}
      <div ref={bottomRef} />
    </div>
  );
}
