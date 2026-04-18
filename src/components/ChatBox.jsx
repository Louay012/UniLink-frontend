import React, { useEffect, useRef, useLayoutEffect } from "react";
import MessageItem from "./MessageItem";

export default function ChatBox({ messages = [], currentUserId, isDirect = false }) {
  const containerRef = useRef(null);
  const prevLastId = useRef(null);

  // Ensure the feed scrolls to the bottom whenever the last message changes.
  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lastId = messages && messages.length ? messages[messages.length - 1].id : null;
    if (lastId !== prevLastId.current) {
      // Scroll after layout; use requestAnimationFrame for safe timing
      requestAnimationFrame(() => {
        try {
          container.scrollTop = container.scrollHeight;
        } catch (e) {
          // ignore
        }
      });
    }
    prevLastId.current = lastId;
  }, [messages]);

  return (
    <div className="message-feed" ref={containerRef}>
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          isDirect={isDirect}
        />
      ))}
      {!messages.length ? <p className="message-empty">No messages yet.</p> : null}
    </div>
  );
}
