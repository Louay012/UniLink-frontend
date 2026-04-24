import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import ChatBox from "../../components/ChatBox";
import { Paperclip, Pencil, Send, X } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import useMessaging from "../../hooks/useMessaging";
import { useNavigate } from "react-router-dom";

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
  const { selectedRole, token } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [token, navigate]);
  const {
    filteredChats,
    contacts,
    currentUserId,
    selectedChat,
    selectedChatId,
    setSelectedChatId,
    messages,
    hasOlderMessages,
    isLoadingOlderMessages,
    loadOlderMessages,
    messageDraft,
    setMessageDraft,
    messageFiles,
    addMessageFiles,
    removeMessageFile,
    selectedContactId,
    setSelectedContactId,
    directMessageDraft,
    setDirectMessageDraft,
    editingMessageId,
    editingBody,
    setEditingBody,
    beginEditMessage,
    cancelEditMessage,
    saveEditedMessage,
    removeMessage,
    searchQuery,
    setSearchQuery,
    isSending,
    sendCurrentMessage,
    createDirectChat,
    error,
    setError
  } = useMessaging(selectedRole);
  const [chatView, setChatView] = useState("DIRECT");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");

  const directChats = useMemo(
    () => filteredChats.filter((chat) => chat.chatType === "DIRECT"),
    [filteredChats]
  );
  const channelChats = useMemo(
    () => filteredChats.filter((chat) => chat.chatType !== "DIRECT"),
    [filteredChats]
  );
  const visibleChats = chatView === "DIRECT" ? directChats : channelChats;
  const isSelectedChatDirect = selectedChat?.chatType === "DIRECT";
  const filteredContacts = useMemo(() => {
    const query = newChatSearch.trim().toLowerCase();
    if (!query) {
      return contacts;
    }

    return contacts.filter((contact) => {
      const haystack = `${contact.name || ""} ${contact.role || ""}`.toLowerCase();
      return haystack.includes(query);
    });
  }, [contacts, newChatSearch]);
  const counterpart = useMemo(() => {
    if (!selectedChat || !isSelectedChatDirect) return null;
    return (selectedChat.members || []).find((member) => String(member.id) !== String(currentUserId)) || null;
  }, [selectedChat, isSelectedChatDirect, currentUserId]);

  useEffect(() => {
    if (!isNewChatModalOpen) {
      return undefined;
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsNewChatModalOpen(false);
      }
    }

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isNewChatModalOpen]);

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
            <div className="messenger-chat-foot">
              <small className="messenger-chat-type">{chat.chatType.replace("_", " ")}</small>
              {(chat.unreadCount || 0) > 0 ? <span className="messenger-unread-badge">{chat.unreadCount}</span> : null}
            </div>
          </div>
        </div>
      </button>
    );
  }

  async function handleStartDirectChat(event) {
    event.preventDefault();
    try {
      await createDirectChat();
      setIsNewChatModalOpen(false);
      setNewChatSearch("");
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

  async function handleSaveEditedMessage(event) {
    event.preventDefault();
    try {
      await saveEditedMessage();
      setError("");
    } catch (e) {
      setError(e.message || "Could not edit message.");
    }
  }

  async function handleDeleteMessage(messageId) {
    try {
      await removeMessage(messageId);
      setError("");
    } catch (e) {
      setError(e.message || "Could not delete message.");
    }
  }

  function handlePickFiles(event) {
    addMessageFiles(event.target.files || []);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className="page-shell messenger-page-shell">
      {error ? <div className="error-banner">{error}</div> : null}

      <article className="card messenger-card">
        <div className="messenger-shell-header">
          <p className="messenger-shell-title">Messenger</p>
          <span className="messenger-shell-subtitle">{filteredChats.length} conversations</span>
        </div>

        <div className="messaging-layout">
          <aside className="chat-list-pane">
            <div className="chat-list-head">
              <h3>Conversations</h3>
              <span>{visibleChats.length} visible</span>
            </div>

            <input
              type="text"
              className="messenger-search"
              placeholder="Search chats or members"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />

            {chatView === "DIRECT" ? (
              <button
                type="button"
                className="new-chat-btn"
                onClick={() => setIsNewChatModalOpen(true)}
              >
                New Chat
              </button>
            ) : null}

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
                  <div className="conversation-meta">
                    <span className="conversation-avatar">{getInitials(selectedChat.title)}</span>
                    <div>
                      <h4>{selectedChat.title}</h4>
                      <small className="conversation-sub">
                        {isSelectedChatDirect ? "Private conversation" : (selectedChat.members || []).map((member) => member.name).join(" · ") || "Members"}
                      </small>
                    </div>
                  </div>

                  <div className="conversation-actions">
                    <span className={`chat-pill ${isSelectedChatDirect ? "direct" : "channel"}`}>
                      {isSelectedChatDirect ? "Direct" : "Channel"}
                    </span>
                    {(selectedChat.unreadCount || 0) > 0 ? (
                      <span className="chat-pill unread">{selectedChat.unreadCount} unread</span>
                    ) : null}
                  </div>
                </div>

                <ChatBox
                  chatId={selectedChat.id}
                  messages={messages}
                  currentUserId={currentUserId}
                  isDirect={selectedChat.chatType === "DIRECT"}
                  onEditMessage={beginEditMessage}
                  onDeleteMessage={handleDeleteMessage}
                  editingMessageId={editingMessageId}
                  hasOlderMessages={hasOlderMessages}
                  isLoadingOlderMessages={isLoadingOlderMessages}
                  onLoadOlderMessages={loadOlderMessages}
                />

                {editingMessageId ? (
                  <form className="message-edit-form" onSubmit={handleSaveEditedMessage}>
                    <div className="message-edit-head">
                      <Pencil size={14} /> Editing message
                    </div>
                    <input
                      type="text"
                      value={editingBody}
                      onChange={(event) => setEditingBody(event.target.value)}
                      placeholder="Update your message"
                    />
                    <div className="message-edit-actions">
                      <button type="button" onClick={cancelEditMessage} className="message-ghost-btn">Cancel</button>
                      <button type="submit">Save</button>
                    </div>
                  </form>
                ) : null}

                {messageFiles.length ? (
                  <div className="message-file-list">
                    {messageFiles.map((file, index) => (
                      <div key={`${file.name}-${file.lastModified}`} className="message-file-chip">
                        <span>{file.name}</span>
                        <button type="button" aria-label="Remove file" onClick={() => removeMessageFile(index)}>
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : null}

                <form className="message-form" onSubmit={handleSendMessage}>
                  <input ref={fileInputRef} type="file" multiple className="hidden-file-input" onChange={handlePickFiles} />
                  <button type="button" className="message-attach-btn" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={16} />
                  </button>
                  <input
                    type="text"
                    value={messageDraft}
                    placeholder="Type your message"
                    onChange={(event) => setMessageDraft(event.target.value)}
                  />
                  <button type="submit" disabled={isSending}>
                    <Send size={14} /> {isSending ? "Sending..." : "Send"}
                  </button>
                </form>
              </>
            )}
          </section>

          <aside className="members-pane">
            {selectedChat ? (
              <>
                <div className="members-header">
                  <h4>{isSelectedChatDirect ? "Profile" : "Group Info"}</h4>
                  <small>{isSelectedChatDirect ? "Direct chat" : `${selectedChat.members?.length || 0} members`}</small>
                </div>

                {isSelectedChatDirect ? (
                  <div className="member-profile-card">
                    <span className="member-avatar profile">{getInitials(counterpart?.name || "User")}</span>
                    <div className="member-meta">
                      <div className="member-name">{counterpart?.name || "Unknown user"}</div>
                      <div className="member-role">{counterpart?.role || "Member"}</div>
                    </div>
                  </div>
                ) : null}

                <div className="members-list">
                  {selectedChat.members?.map((m) => (
                    <div key={m.id} className="member-item">
                      <span className="member-avatar">{getInitials(m.name)}</span>
                      <div className="member-meta">
                        <div className="member-name">{m.name}</div>
                        <div className="member-role">{m.role || 'Member'}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <p className="subtitle">Select a chat to view members.</p>
            )}
          </aside>
        </div>
      </article>

      {isNewChatModalOpen ? (
        <div className="chat-modal-backdrop" onClick={() => setIsNewChatModalOpen(false)}>
          <div className="chat-modal-panel" onClick={(event) => event.stopPropagation()}>
            <div className="chat-modal-header">
              <div>
                <p className="chat-modal-kicker">Direct Conversation</p>
                <h3>Start New Chat</h3>
              </div>
              <button
                type="button"
                className="chat-modal-close"
                onClick={() => setIsNewChatModalOpen(false)}
                aria-label="Close new chat modal"
              >
                <X size={18} />
              </button>
            </div>

            <form className="chat-modal-form" onSubmit={handleStartDirectChat}>
              <label htmlFor="new-chat-search">Search user</label>
              <input
                id="new-chat-search"
                type="text"
                placeholder="Type a name or role"
                value={newChatSearch}
                onChange={(event) => setNewChatSearch(event.target.value)}
              />

              <label htmlFor="new-chat-target">Select contact</label>
              <select
                id="new-chat-target"
                value={selectedContactId}
                onChange={(event) => setSelectedContactId(event.target.value)}
              >
                {!filteredContacts.length ? <option value="">No matching contacts</option> : null}
                {filteredContacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.name} ({contact.role})
                  </option>
                ))}
              </select>

              <label htmlFor="new-chat-first-message">Optional first message</label>
              <input
                id="new-chat-first-message"
                type="text"
                placeholder="Say hello"
                value={directMessageDraft}
                onChange={(event) => setDirectMessageDraft(event.target.value)}
              />

              <div className="chat-modal-actions">
                <button
                  type="button"
                  className="chat-modal-secondary"
                  onClick={() => setIsNewChatModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="chat-modal-primary" disabled={!selectedContactId}>
                  Start Chat
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </div>
  );
}
