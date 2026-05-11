import React from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import ChatBox from "../../components/ChatBox";
import { Paperclip, Pencil, Send, X, Trash2, MessageCircle, Users, FileText, ArrowLeft, PanelRightClose, PanelRight, Search } from 'lucide-react';
import { useAuth } from "../../context/AuthContext";
import useMessaging from "../../hooks/useMessaging";
import { useNavigate } from "react-router-dom";
import { API_BASE } from "../../services/api";
import { searchUsers } from "../../services/chat.service";

const BACKEND_BASE = API_BASE.replace(/\/api$/, "");

function resolveAttachmentUrl(value) {
  if (!value) return "#";
  if (/^https?:\/\//i.test(value)) return value;
  if (value.startsWith("/")) return `${BACKEND_BASE}${value}`;
  return `${BACKEND_BASE}/${value}`;
}

async function downloadAttachment(url, fileName = "attachment") {
  const token = localStorage.getItem("unilink_token");
  const role = localStorage.getItem("unilink_role");
  const userId = localStorage.getItem("unilink_userId");

  const headers = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(role ? { "x-unilink-role": role } : {}),
    ...(userId ? { "x-unilink-user-id": userId } : {})
  };

  try {
    const response = await fetch(url, { headers });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch (err) {
    console.error("Download failed:", err);
    alert("Failed to download file.");
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
    removeChat,
    searchQuery,
    setSearchQuery,
    messageSearchQuery,
    setMessageSearchQuery,
    isSending,
    sendCurrentMessage,
    createDirectChat,
    error,
    setError
  } = useMessaging(selectedRole);
  const [chatView, setChatView] = useState("DIRECT");
  const [isNewChatModalOpen, setIsNewChatModalOpen] = useState(false);
  const [newChatSearch, setNewChatSearch] = useState("");
  const [searchedUsers, setSearchedUsers] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [messageToDelete, setMessageToDelete] = useState(null);
  const [deleteChatConfirmOpen, setDeleteChatConfirmOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState(null);
  const [rightPanelTab, setRightPanelTab] = useState("members");
  const [isMembersPanelOpen, setIsMembersPanelOpen] = useState(true);

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
  const displayedContacts = newChatSearch.trim() ? searchedUsers : contacts;
  const counterpart = useMemo(() => {
    if (!selectedChat || !isSelectedChatDirect) return null;
    return (selectedChat.members || []).find((member) => String(member.id) !== String(currentUserId)) || null;
  }, [selectedChat, isSelectedChatDirect, currentUserId]);

  useEffect(() => {
    if (!selectedChatId) {
      return;
    }

    setRightPanelTab(isSelectedChatDirect ? "files" : "members");
  }, [selectedChatId, isSelectedChatDirect]);

  useEffect(() => {
    if (!isNewChatModalOpen) {
      setNewChatSearch("");
      setSearchedUsers([]);
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

  useEffect(() => {
    if (!isNewChatModalOpen || newChatSearch.trim().length === 0) {
      setSearchedUsers([]);
      return;
    }

    const timer = setTimeout(() => {
      setIsSearchingUsers(true);
      searchUsers(selectedRole, newChatSearch.trim())
        .then((payload) => {
          setSearchedUsers(payload.items || payload.users || payload || []);
        })
        .catch((err) => {
          console.error("Search users failed:", err);
          setSearchedUsers([]);
        })
        .finally(() => setIsSearchingUsers(false));
    }, 400);

    return () => clearTimeout(timer);
  }, [newChatSearch, isNewChatModalOpen, selectedRole]);

  function renderChatItem(chat) {
    const lastActivityTime = chat.lastMessage?.createdAt || chat.updatedAt || chat.createdAt;

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
              <small className="messenger-chat-time" title={lastActivityTime ? new Date(lastActivityTime).toLocaleString() : ""}>
                {formatRelativeTime(lastActivityTime)}
              </small>
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

  function handleDeleteMessage(messageId) {
    setMessageToDelete(messageId);
    setDeleteConfirmOpen(true);
  }

  async function confirmDelete() {
    if (!messageToDelete) return;
    try {
      await removeMessage(messageToDelete);
      setError("");
    } catch (e) {
      setError(e.message || "Could not delete message.");
    } finally {
      setDeleteConfirmOpen(false);
      setMessageToDelete(null);
    }
  }

  function cancelDelete() {
    setDeleteConfirmOpen(false);
    setMessageToDelete(null);
  }

  function handleDeleteChat() {
    setDeleteChatConfirmOpen(true);
  }

  async function confirmDeleteChat() {
    try {
      await removeChat();
      setError("");
    } catch (e) {
      setError(e.message || "Could not delete chat.");
    } finally {
      setDeleteChatConfirmOpen(false);
    }
  }

  function cancelDeleteChat() {
    setDeleteChatConfirmOpen(false);
  }

  function handlePickFiles(event) {
    addMessageFiles(event.target.files || []);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }

  return (
    <div className={`page-shell messenger-page-shell ${selectedChatId ? 'has-selected-chat' : ''}`}>
      {error ? <div className="error-banner">{error}</div> : null}

      <article className="card messenger-card">
        <div className="messenger-top-bar">
          <div className="messenger-search-wrap">
            <input
              type="text"
              className="messenger-search"
              placeholder={chatView === "DIRECT" ? "Search conversations..." : "Search channels..."}
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
            />
          </div>

          <div className="messenger-view-tabs">
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
            <button
              type="button"
              className="new-chat-btn"
              onClick={() => setIsNewChatModalOpen(true)}
              aria-label="New Chat"
            >
              <MessageCircle size={16} />
            </button>
          ) : null}
        </div>

        <div className={`messaging-layout ${isMembersPanelOpen ? '' : 'collapsed'}`}>
          <aside className="chat-list-pane">
            <div className="chat-list">
              {visibleChats.map((chat) => renderChatItem(chat))}
              {!visibleChats.length ? (
                <p className="chat-empty-state">{chatView === "DIRECT" ? "No direct chats yet." : "No channel chats available."}</p>
              ) : null}
            </div>
          </aside>

          <section className="conversation">
            {!selectedChat ? (
              <p className="empty-state">Select a chat to view messages.</p>
            ) : (
              <>
                <div className="conversation-header">
                  <button
                    type="button"
                    className="mobile-back-btn"
                    onClick={() => setSelectedChatId(null)}
                    aria-label="Back to chats"
                  >
                    <ArrowLeft size={18} />
                  </button>
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
                    <button
                      type="button"
                      className="toggle-panel-btn"
                      onClick={() => setIsMembersPanelOpen(!isMembersPanelOpen)}
                      aria-label={isMembersPanelOpen ? "Hide panel" : "Show panel"}
                    >
                      {isMembersPanelOpen ? <PanelRightClose size={16} /> : <PanelRight size={16} />}
                    </button>
                    {isSelectedChatDirect && (
                      <button
                        type="button"
                        className="delete-chat-btn"
                        onClick={handleDeleteChat}
                        aria-label="Delete chat"
                        title="Delete chat"
                        style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", marginLeft: "0.5rem" }}
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
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

          {isMembersPanelOpen && selectedChat ? (
            <aside className="members-pane">
                <div className="panel-tabs">
                  {!isSelectedChatDirect ? (
                    <button
                      type="button"
                      className={rightPanelTab === "members" ? "active" : ""}
                      onClick={() => setRightPanelTab("members")}
                    >
                      <Users size={14} /> Members
                    </button>
                  ) : null}
                  <button
                    type="button"
                    className={rightPanelTab === "files" ? "active" : ""}
                    onClick={() => setRightPanelTab("files")}
                  >
                    <FileText size={14} /> Files
                  </button>
                  <button
                    type="button"
                    className={rightPanelTab === "search" ? "active" : ""}
                    onClick={() => setRightPanelTab("search")}
                  >
                    <Search size={14} /> Search
                  </button>
                </div>

                <div className="panel-content">
                  {!isSelectedChatDirect && rightPanelTab === "members" ? (
                    <>
                      <div className="members-header">
                        <h4>Group Info</h4>
                        <small>{`${selectedChat.members?.length || 0} members`}</small>
                      </div>

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
                  ) : rightPanelTab === "files" ? (
                    <div className="files-panel">
                      <div className="files-header">
                        <h4>Shared Files</h4>
                        <small>{messages.filter(m => m.attachments?.length).reduce((acc, m) => acc + m.attachments.length, 0)} files</small>
                      </div>
                      <div className="files-list">
                        {messages
                          .filter(m => m.attachments?.length)
                          .flatMap(m => m.attachments.map(a => ({ ...a, messageId: m.id })))
                          .map((attachment, idx) => (
                            <button
                              type="button"
                              key={`file-${idx}`}
                              onClick={() => downloadAttachment(resolveAttachmentUrl(attachment.fileUrl), attachment.fileName || "attachment")}
                              className="file-item"
                            >
                              <FileText size={16} />
                              <div className="file-meta">
                                <span className="file-name">{attachment.fileName || "Attachment"}</span>
                                <small>{attachment.mimeType || "file"}</small>
                              </div>
                            </button>
                          ))}
                        {!messages.some(m => m.attachments?.length) ? (
                          <p className="chat-empty-state">No files shared yet.</p>
                        ) : null}
                      </div>
                    </div>
                  ) : rightPanelTab === "search" ? (
                    <div className="search-panel">
                      <div className="search-header" style={{ padding: "1rem" }}>
                        <h4>Search messages</h4>
                      </div>
                      <div style={{ padding: "0 1rem" }}>
                        <input
                          type="text"
                          className="messenger-search"
                          placeholder="Search in conversation..."
                          value={messageSearchQuery}
                          onChange={(event) => setMessageSearchQuery(event.target.value)}
                          style={{ width: "100%", padding: "0.5rem", borderRadius: "0.25rem", border: "1px solid #ccc", fontSize: "0.875rem" }}
                        />
                      </div>
                    </div>
                  ) : null}
                </div>
            </aside>
          ) : null}
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
                {!displayedContacts.length ? (
                  <option value="">{isSearchingUsers ? "Searching..." : "No matching contacts"}</option>
                ) : (
                  <option value="">-- Select a User --</option>
                )}
                {displayedContacts.map((contact) => (
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

      {deleteConfirmOpen ? (
        <div className="delete-confirm-backdrop" onClick={cancelDelete}>
          <div className="delete-confirm-panel" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <Trash2 size={20} color="#dc2626" />
              <h4>Delete Message</h4>
            </div>
            <p className="delete-confirm-text">Are you sure you want to delete this message? This action cannot be undone.</p>
            <div className="delete-confirm-actions">
              <button type="button" className="delete-confirm-cancel" onClick={cancelDelete}>Cancel</button>
              <button type="button" className="delete-confirm-delete" onClick={confirmDelete}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteChatConfirmOpen ? (
        <div className="delete-confirm-backdrop" onClick={cancelDeleteChat}>
          <div className="delete-confirm-panel" onClick={(e) => e.stopPropagation()}>
            <div className="delete-confirm-header">
              <Trash2 size={20} color="#dc2626" />
              <h4>Delete Chat</h4>
            </div>
            <p className="delete-confirm-text">Are you sure you want to delete this conversation? This will delete the entire chat and all its messages permanently.</p>
            <div className="delete-confirm-actions">
              <button type="button" className="delete-confirm-cancel" onClick={cancelDeleteChat}>Cancel</button>
              <button type="button" className="delete-confirm-delete" onClick={confirmDeleteChat}>Delete</button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
