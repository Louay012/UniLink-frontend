import React from "react";
import { Pencil, Trash2, PencilLine } from "lucide-react";
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

export default function MessageItem({
  message,
  currentUserId,
  isDirect = false,
  onEdit,
  onDelete,
  isEditing = false
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
    <div className={`message-row ${isMine ? "mine" : "theirs"}`}>
      {!isMine ? <span className="message-avatar">{initials}</span> : null}

      <div className={`message-item ${isMine ? "mine" : ""}`}>
        {!isMine && !isDirect ? <strong>{senderName}</strong> : null}
        {message.isDeleted ? <p className="message-deleted">{senderName} deleted a message</p> : <p>{message.body}</p>}

        {Array.isArray(message.attachments) && message.attachments.length ? (
          <div className="message-attachments">
            {message.attachments.map((attachment) => (
              <a
                key={attachment.id}
                href={resolveAttachmentUrl(attachment.fileUrl)}
                target="_blank"
                rel="noreferrer"
                className="message-attachment-link"
              >
                <span>{attachment.fileName || "Attachment"}</span>
                <small>{[attachment.mimeType || "file", readableFileSize(attachment.fileSize)].filter(Boolean).join(" · ")}</small>
              </a>
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
