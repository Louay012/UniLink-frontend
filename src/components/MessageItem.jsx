import React from "react";
import { Pencil, Trash2, PencilLine, Reply, Forward } from "lucide-react";
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

export default function MessageItem({
  message,
  currentUserId,
  isDirect = false,
  onEdit,
  onDelete,
  onReply,
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

  return (
    <div className={`message-row ${isMine ? "mine" : "theirs"}`} ref={innerRef} data-message-id={message.id}>
      {!isMine ? <span className="message-avatar">{initials}</span> : null}

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

          {isMine && !message.isDeleted ? (
            <div className="message-actions">
              <button type="button" onClick={() => onReply?.(message)} title="Reply">
                <Reply size={12} />
              </button>
              <button type="button" onClick={() => onEdit?.(message)} disabled={isEditing} title="Edit">
                <Pencil size={12} />
              </button>
              <button type="button" onClick={() => onDelete?.(message.id)} title="Delete">
                <Trash2 size={12} />
              </button>
            </div>
          ) : null}
        </div>
      </div>

      {isMine ? <span className="message-avatar mine">{initials}</span> : null}
    </div>
  );
}
