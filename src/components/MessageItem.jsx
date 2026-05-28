import React, { useState } from "react";
import { Pencil, Trash2, PencilLine, Reply, Forward, SmilePlus } from "lucide-react";
import { API_BASE } from "../services/api";

const BACKEND_BASE = API_BASE.replace(/\/api$/, "");

function readableFileSize(size) {
  const value = Number(size);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function resolveAttachmentUrl(value) {
  if (!value) {
    return "#";
  }
  if (/^https?:\/\//i.test(value)) {
    return value;
  }
  if (value.startsWith("/")) {
    return `${BACKEND_BASE}${value}`;
  }
  return `${BACKEND_BASE}/${value}`;
}

function isImageAttachment(attachment) {
  return Boolean(attachment?.mimeType && String(attachment.mimeType).toLowerCase().startsWith("image/"));
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
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
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
    alert("Failed to download file. Please try again.");
  }
}

function MessageAvatar({ userId, initials, isMine }) {
  const [photoLoaded, setPhotoLoaded] = useState(false);
  const [photoKey, setPhotoKey] = useState(Date.now());

  React.useEffect(() => {
    function refresh() { setPhotoKey(Date.now()); setPhotoLoaded(false); }
    window.addEventListener("avatar-updated", refresh);
    window.addEventListener("focus", refresh);
    return () => {
      window.removeEventListener("avatar-updated", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, []);

  const src = `${API_BASE}/profile/photo/${userId}?t=${photoKey}`;

  return (
    <span className={`message-avatar ${isMine ? "mine" : ""} overflow-hidden p-0`}>
      <img
        src={src}
        alt={initials}
        className="w-full h-full object-cover rounded-full"
        onLoad={() => setPhotoLoaded(true)}
        onError={() => setPhotoLoaded(false)}
        style={{ display: photoLoaded ? "block" : "none" }}
      />
      {!photoLoaded ? initials : null}
    </span>
  );
}

export default function MessageItem({
  message,
  currentUserId,
  isDirect = false,
  onEdit,
  onDelete,
  onReply,
  onToggleReaction,
  isEditing = false,
  isHighlighted = false,
  innerRef = null
}) {
  const isMine = message.senderUserId === currentUserId;
  const senderName = message.sender?.name || "Unknown";
  const initials = senderName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("") || "?";
  const createdAt = message.createdAt ? new Date(message.createdAt) : null;
  const createdLabel = createdAt && !Number.isNaN(createdAt.getTime())
    ? createdAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })
    : "";

  const [showPicker, setShowPicker] = useState(false);
  const commonEmojis = ["👍", "❤️", "😂", "😮", "😢", "🎉", "🔥"];

  // Group reactions by emoji
  const groupedReactions = Array.isArray(message.reactions)
    ? message.reactions.reduce((acc, curr) => {
        if (!acc[curr.emoji]) acc[curr.emoji] = [];
        acc[curr.emoji].push(curr.userId);
        return acc;
      }, {})
    : {};

  return (
    <div className={`message-row ${isMine ? "mine" : "theirs"}`} ref={innerRef} data-message-id={message.id}>
      {!isMine ? <MessageAvatar userId={message.senderUserId} initials={initials} isMine={false} /> : null}

      <div className={`message-item ${isMine ? "mine" : ""} ${isHighlighted ? "highlighted" : ""}`}>
        {!isMine && !isDirect ? <strong>{senderName}</strong> : null}

        {message.replyToMessage ? (
          <div className="message-reply-preview">
            <span className="message-reply-label">Replying to {message.replyToMessage.sender?.name || "message"}</span>
            <p>{message.replyToMessage.body || "Attachment or deleted message"}</p>
          </div>
        ) : null}

        {message.forwardedFromMessage ? (
          <div className="message-forward-preview">
            <Forward size={11} />
            <span>Forwarded from {message.forwardedFromMessage.sender?.name || "message"}</span>
          </div>
        ) : null}

        {message.isDeleted ? <p className="message-deleted">{senderName} deleted a message</p> : <p>{message.body}</p>}

        {Array.isArray(message.attachments) && message.attachments.length ? (
          <div className="message-attachments">
            {message.attachments.map((attachment) => (
              <div key={attachment.id} className={`message-attachment-card ${isImageAttachment(attachment) ? "image" : ""}`}>
                {isImageAttachment(attachment) ? (
                  <button
                    type="button"
                    className="message-image-preview"
                    onClick={() => downloadAttachment(resolveAttachmentUrl(attachment.fileUrl), attachment.fileName || "attachment")}
                    title="Open image attachment"
                  >
                    <img src={resolveAttachmentUrl(attachment.fileUrl)} alt={attachment.fileName || "Attachment"} loading="lazy" />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => downloadAttachment(resolveAttachmentUrl(attachment.fileUrl), attachment.fileName || "attachment")}
                  className="message-attachment-link"
                >
                  <span>{attachment.fileName || "Attachment"}</span>
                  <small>{[attachment.mimeType || "file", readableFileSize(attachment.fileSize)].filter(Boolean).join(" · ")}</small>
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="message-meta-row">
          <small>
            {createdLabel}
            {message.isEdited ? <span> · edited <PencilLine size={10} /></span> : ""}
            {isMine && message.isRead ? " · seen" : ""}
          </small>

          {!message.isDeleted ? (
            <div className="message-actions">
              <div className="reaction-picker-container">
                <button
                  type="button"
                  onClick={() => setShowPicker(!showPicker)}
                  title="React"
                >
                  <SmilePlus size={12} />
                </button>
                {showPicker && (
                  <div className="reaction-picker-popover">
                    {commonEmojis.map(e => (
                      <button
                        key={e}
                        type="button"
                        onClick={() => {
                          onToggleReaction?.(message.id, e);
                          setShowPicker(false);
                        }}
                      >
                        {e}
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <button type="button" onClick={() => onReply?.(message)} title="Reply">
                <Reply size={12} />
              </button>
              {isMine ? (
                <>
                  <button type="button" onClick={() => onEdit?.(message)} disabled={isEditing} title="Edit">
                    <Pencil size={12} />
                  </button>
                  <button type="button" onClick={() => onDelete?.(message.id)} title="Delete">
                    <Trash2 size={12} />
                  </button>
                </>
              ) : null}
            </div>
          ) : null}
        </div>
        
        {Object.keys(groupedReactions).length > 0 && !message.isDeleted ? (
          <div className="message-reactions-row">
            {Object.entries(groupedReactions).map(([emoji, userIds]) => {
              const hasReacted = userIds.includes(currentUserId);
              return (
                <button
                  key={emoji}
                  className={`reaction-bubble ${hasReacted ? "active" : ""}`}
                  onClick={() => onToggleReaction?.(message.id, emoji)}
                  type="button"
                >
                  {emoji} <small>{userIds.length}</small>
                </button>
              );
            })}
          </div>
        ) : null}
      </div>

      {isMine ? <MessageAvatar userId={message.senderUserId} initials={initials} isMine={true} /> : null}
    </div>
  );
}
