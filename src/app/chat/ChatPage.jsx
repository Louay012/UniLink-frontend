import React from "react";
import { useMemo, useState } from "react";

import ChatBox from "../../components/ChatBox";
import { useAuth } from "../../context/AuthContext";
import useMessaging from "../../hooks/useMessaging";

function formatDate(value) {
  try {
    return new Date(value).toLocaleString();
  } catch {
    return value;
  }
}

function formatRelativeTime(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) {
    return "now";
  }
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return `${hours}h`;
  }
  const days = Math.floor(hours / 24);
  if (days < 7) {
    return `${days}d`;
  }

  return date.toLocaleDateString();
}

function getInitials(value) {
  if (!value) {
    return "?";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

export default function ChatPage() {
  const { selectedRole, setSelectedRole, roleOptions } = useAuth();
  const {
    chats,
    contacts,
    currentUserId,
    selectedChat,
    selectedChatId,
    setSelectedChatId,
    messages,
    messageDraft,
    setMessageDraft,
    selectedContactId,
    setSelectedContactId,
    directMessageDraft,
    setDirectMessageDraft,
    sendCurrentMessage,
    createDirectChat,
    error,
    setError
  } = useMessaging(selectedRole);
  const [chatView, setChatView] = useState("DIRECT");

  const directChats = useMemo(
    () => chats.filter((chat) => chat.chatType === "DIRECT"),
    [chats]
  );
  const channelChats = useMemo(
    () => chats.filter((chat) => chat.chatType !== "DIRECT"),
    [chats]
  );
  const visibleChats = chatView === "DIRECT" ? directChats : channelChats;
  const isSelectedChatDirect = selectedChat?.chatType === "DIRECT";

  function renderChatItem(chat) {
    return (
      <button
        key={chat.id}
        className={`chat-item ${selectedChatId === chat.id ? "selected" : ""}`}
        onClick={() => setSelectedChatId(chat.id)}
      >
        <div className="messenger-chat-row">
          <span className="messenger-chat-avatar">{getInitials(chat.title)}</span>
          <div className="messenger-chat-meta">
            <div className="messenger-chat-top">
              <h4>{chat.title}</h4>
              <small className="messenger-chat-time">{formatRelativeTime(chat.lastMessage?.createdAt)}</small>
            </div>
            <p className="messenger-chat-preview">
              {chat.lastMessage?.body || (chat.chatType === "DIRECT" ? "Start your conversation" : "No messages yet")}
            </p>
            <small className="messenger-chat-type">{chat.chatType.replace("_", " ")}</small>
          </div>
        </div>
      </button>
    );
  }

  async function handleStartDirectChat(event) {
    event.preventDefault();
    try {
      await createDirectChat();
      setError("");
    } catch (e) {
      setError(e.message || "Could not create direct chat.");
    }
  }

  async function handleSendMessage(event) {
    event.preventDefault();
    try {
      await sendCurrentMessage();
      setError("");
    } catch (e) {
      setError(e.message || "Could not send message.");
    }
  }

  return (
    <div className="page-shell">
      <header className="hero">
        <div>
          <p className="tag">UniLink</p>
          <h1>Messaging Hub</h1>
          <p className="subtitle">Direct and course conversations, separated from dashboard logic.</p>
        </div>
        <div className="role-switch">
          {roleOptions.map((role) => (
            <button
              key={role.value}
              className={selectedRole.value === role.value ? "active" : ""}
              onClick={() => setSelectedRole(role)}
            >
              {role.label}
            </button>
          ))}
        </div>
      </header>

      {error ? <div className="error-banner">{error}</div> : null}

      <article className="card messenger-card">
        <div className="messaging-layout">
          <aside className="chat-list-pane">
            <div className="chat-list-head">
              <h3>Messenger</h3>
              <span>{visibleChats.length} active</span>
            </div>

            <div className="chat-view-switch" role="tablist" aria-label="Chat views">
              <button
                type="button"
                className={chatView === "DIRECT" ? "active" : ""}
                onClick={() => setChatView("DIRECT")}
              >
                Direct
              </button>
              <button
                type="button"
                className={chatView === "CHANNEL" ? "active" : ""}
                onClick={() => setChatView("CHANNEL")}
              >
                Channels
              </button>
            </div>

            {chatView === "DIRECT" ? (
              <form className="messenger-start-form" onSubmit={handleStartDirectChat}>
                <select
                  value={selectedContactId}
                  onChange={(event) => setSelectedContactId(event.target.value)}
                >
                  {!contacts.length ? <option value="">No available contacts</option> : null}
                  {contacts.map((contact) => (
                    <option key={contact.id} value={contact.id}>
                      {contact.name} ({contact.role})
                    </option>
                  ))}
                </select>
                <input
                  type="text"
                  placeholder="Say hello..."
                  value={directMessageDraft}
                  onChange={(event) => setDirectMessageDraft(event.target.value)}
                />
                <button type="submit" disabled={!selectedContactId}>New Chat</button>
              </form>
            ) : null}

            <div className="chat-list">
              {chatView === "DIRECT" ? <p className="chat-section-title">Direct Messages</p> : null}
              {chatView === "CHANNEL" ? <p className="chat-section-title">Class and Course Chats</p> : null}
              {visibleChats.map((chat) => renderChatItem(chat))}
              {!visibleChats.length ? (
                <p>{chatView === "DIRECT" ? "No direct chats yet." : "No channel chats available."}</p>
              ) : null}
            </div>
          </aside>

          <section className="conversation">
            {!selectedChat ? (
              <p className="empty-state">Select a chat to view messages.</p>
            ) : (
              <>
                <div className="conversation-header">
                  <span className="conversation-avatar">{getInitials(selectedChat.title)}</span>
                  <div>
                    <h4>{selectedChat.title}</h4>
                    <small>
                      {isSelectedChatDirect
                        ? "Private conversation"
                        : selectedChat.members.map((member) => member.name).join(" . ")}
                    </small>
                  </div>
                  <span className={`chat-pill ${isSelectedChatDirect ? "direct" : "channel"}`}>
                    {isSelectedChatDirect ? "Direct" : "Channel"}
                  </span>
                </div>

                <ChatBox
                  messages={messages}
                  currentUserId={currentUserId}
                  isDirect={selectedChat.chatType === "DIRECT"}
                />

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={messageDraft}
                    placeholder="Type your message"
                    onChange={(event) => setMessageDraft(event.target.value)}
                  />
                  <button type="submit">Send</button>
                </form>
              </>
            )}
          </section>
        </div>
      </article>
    </div>
  );
}
