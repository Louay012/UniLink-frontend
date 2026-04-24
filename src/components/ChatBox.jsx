import React, { useEffect, useRef, useLayoutEffect } from "react";
import MessageItem from "./MessageItem";

export default function ChatBox({
  chatId,
  messages = [],
  currentUserId,
  isDirect = false,
  onEditMessage,
  onDeleteMessage,
  editingMessageId,
  hasOlderMessages = false,
  isLoadingOlderMessages = false,
  onLoadOlderMessages
}) {
  const containerRef = useRef(null);
  const previousMetricsRef = useRef({ count: 0, lastId: null });
  const nearBottomRef = useRef(true);
  const pendingPrependRef = useRef(null);
  const loadingOlderRef = useRef(false);
  const activeChatRef = useRef(chatId);

  useEffect(() => {
    activeChatRef.current = chatId;
    previousMetricsRef.current = { count: 0, lastId: null };
    pendingPrependRef.current = null;
    nearBottomRef.current = true;
  }, [chatId]);

  useEffect(() => {
    loadingOlderRef.current = isLoadingOlderMessages;
  }, [isLoadingOlderMessages]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight;
      nearBottomRef.current = distanceFromBottom < 72;

      const canLoadOlder =
        typeof onLoadOlderMessages === "function" &&
        hasOlderMessages &&
        !loadingOlderRef.current &&
        container.scrollTop <= 56;

      if (!canLoadOlder) {
        return;
      }

      pendingPrependRef.current = {
        scrollHeight: container.scrollHeight,
        scrollTop: container.scrollTop
      };
      loadingOlderRef.current = true;

      Promise.resolve(onLoadOlderMessages()).catch(() => {
        pendingPrependRef.current = null;
      });
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      container.removeEventListener("scroll", handleScroll);
    };
  }, [hasOlderMessages, onLoadOlderMessages]);

  useLayoutEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const lastId = messages && messages.length ? messages[messages.length - 1].id : null;
    const previous = previousMetricsRef.current;

    requestAnimationFrame(() => {
      try {
        if (pendingPrependRef.current && !isLoadingOlderMessages) {
          const anchor = pendingPrependRef.current;
          const growth = container.scrollHeight - anchor.scrollHeight;
          container.scrollTop = anchor.scrollTop + Math.max(growth, 0);
          pendingPrependRef.current = null;
          previousMetricsRef.current = { count: messages.length, lastId };
          return;
        }

        const isInitialBatch = previous.count === 0 && messages.length > 0;
        const isAppend = previous.count > 0 && messages.length > previous.count && lastId !== previous.lastId;

        if (isInitialBatch || (isAppend && nearBottomRef.current)) {
          container.scrollTop = container.scrollHeight;
        }
      } catch (_error) {
        // ignore layout sync errors
      }

      previousMetricsRef.current = { count: messages.length, lastId };
    });
  }, [messages, isLoadingOlderMessages]);

  return (
    <div className="message-feed" ref={containerRef}>
      {isLoadingOlderMessages ? <p className="message-loading-older">Loading older messages...</p> : null}
      {messages.map((message) => (
        <MessageItem
          key={message.id}
          message={message}
          currentUserId={currentUserId}
          isDirect={isDirect}
          onEdit={onEditMessage}
          onDelete={onDeleteMessage}
          isEditing={editingMessageId === message.id}
        />
      ))}
      {!messages.length ? <p className="message-empty">No messages yet.</p> : null}
    </div>
  );
}
