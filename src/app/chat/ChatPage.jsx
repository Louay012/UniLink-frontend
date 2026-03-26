import React from "react";

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

export default function ChatPage() {
  const { selectedRole, setSelectedRole, roleOptions } = useAuth();
  const {
    chats,
    contacts,
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

      <article className="card">
        <div className="card-header">
          <h3>Chats</h3>
          <span>{chats.length} chats</span>
        </div>

        <form className="direct-form" onSubmit={handleStartDirectChat}>
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
            placeholder="Optional first message"
            value={directMessageDraft}
            onChange={(event) => setDirectMessageDraft(event.target.value)}
          />
          <button type="submit" disabled={!selectedContactId}>Start Direct Chat</button>
        </form>

        <div className="messaging-layout">
          <div className="chat-list">
            {chats.map((chat) => (
              <button
                key={chat.id}
                className={`chat-item ${selectedChatId === chat.id ? "selected" : ""}`}
                onClick={() => setSelectedChatId(chat.id)}
              >
                <h4>{chat.title}</h4>
                <p>{chat.chatType.replace("_", " ")}</p>
                <small>{chat.lastMessage ? formatDate(chat.lastMessage.createdAt) : "No messages yet"}</small>
              </button>
            ))}
            {!chats.length ? <p>No chats available for this account.</p> : null}
          </div>

          <div className="conversation">
            {!selectedChat ? (
              <p className="empty-state">Select a chat to view messages.</p>
            ) : (
              <>
                <div className="conversation-header">
                  <h4>{selectedChat.title}</h4>
                  <small>{selectedChat.members.map((member) => member.name).join(" . ")}</small>
                </div>

                <ChatBox messages={messages} currentUserId={selectedRole.userId} />

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input
                    type="text"
                    value={messageDraft}
                    placeholder="Write a message"
                    onChange={(event) => setMessageDraft(event.target.value)}
                  />
                  <button type="submit">Send</button>
                </form>
              </>
            )}
          </div>
        </div>
      </article>
    </div>
  );
}
