import { useState } from "react";
import { Paperclip, Download } from "lucide-react";
import { API_BASE } from "../services/api";

/* ─── helpers ───────────────────────────────────────────── */

function timeAgo(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return String(dateStr);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function authorInitials(name) {
  const parts = String(name || "T").trim().split(/\s+/);
  if (parts.length === 1) return parts[0].charAt(0).toUpperCase();
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

const AVATAR_COLORS = [
  "#6366f1", "#0ea5e9", "#10b981", "#f59e0b",
  "#ef4444", "#8b5cf6", "#ec4899", "#14b8a6",
];

function avatarColor(name = "") {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function formatFileSize(bytes) {
  const size = Number(bytes);
  if (!Number.isFinite(size) || size <= 0) return '';
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  if (size >= 1024) return `${Math.round(size / 1024)} KB`;
  return `${size} B`;
}

/* ─── Avatar with photo fallback ─────────────────────────── */

function AuthorAvatar({ authorId, author, color }) {
  const [imgError, setImgError] = useState(false);
  const initials = authorInitials(author);
  const photoUrl = authorId ? `${API_BASE}/profile/photo/${authorId}` : null;

  if (photoUrl && !imgError) {
    return (
      <img
        src={photoUrl}
        alt={author}
        className="h-10 w-10 rounded-full object-cover shrink-0 ring-2 ring-white shadow-sm"
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className="h-10 w-10 rounded-full text-white grid place-items-center text-sm font-bold shrink-0 ring-2 ring-white shadow-sm"
      style={{ background: color }}
    >
      {initials}
    </div>
  );
}

/* ─── Badge ─────────────────────────────────────────────── */

function PriorityBadge({ type }) {
  if (!type || type === "NORMAL") return null;

  const config = {
    URGENT: {
      label: "Urgent",
      icon: "🔴",
      className: "bg-red-50 text-red-700 border border-red-200",
    },
    PINNED: {
      label: "Pinned",
      icon: "📌",
      className: "bg-amber-50 text-amber-700 border border-amber-200",
    },
  };

  const { label, icon, className } = config[type] || {
    label: type,
    icon: "📢",
    className: "bg-slate-100 text-slate-600 border border-slate-200",
  };

  return (
    <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full ${className}`}>
      <span>{icon}</span>
      {label}
    </span>
  );
}

/* ─── Main Component ─────────────────────────────────────── */

export default function AnnouncementCard({
  announcement,
  showCourse = false,
  courseColor = null,
  actionLabel,
  onAction,
}) {
  const author = announcement.author || "Teacher";
  const color = courseColor || avatarColor(author);

  return (
    <article className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden transition-all duration-200 hover:border-slate-300 hover:shadow-md">
      {/* ── Header ── */}
      <header className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Avatar */}
          <AuthorAvatar
            authorId={announcement.authorId}
            author={author}
            color={color}
          />

          {/* Author info */}
          <div className="min-w-0 pt-0.5">
            <p className="text-sm font-semibold text-slate-900 truncate leading-tight">
              {author}
            </p>
            <p className="text-xs text-slate-400 mt-0.5">
              Teacher
              {announcement.timestamp && (
                <>
                  {" · "}
                  <time dateTime={announcement.timestamp} title={new Date(announcement.timestamp).toLocaleString()}>
                    {timeAgo(announcement.timestamp)}
                  </time>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Badges */}
        <div className="flex items-center gap-2 shrink-0 pt-0.5">
          <PriorityBadge type={announcement.visualType} />
          {showCourse && announcement.courseTitle ? (
            <span className="text-[11px] px-2.5 py-1 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 font-medium">
              {announcement.courseTitle}
            </span>
          ) : null}
        </div>
      </header>

      {/* ── Divider ── */}
      <div className="h-px bg-slate-100 mx-5" />

      {/* ── Body ── */}
      <div className="px-5 py-4">
        <h3 className="text-base font-bold text-slate-900 leading-snug">
          {announcement.title}
        </h3>

        {announcement.content && (
          <p className="mt-2 text-sm text-slate-600 leading-relaxed whitespace-pre-line">
            {announcement.content}
          </p>
        )}

        {/* Attachments */}
        {announcement.attachments?.length > 0 && (
          <div className="mt-4">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 mb-2">
              <Paperclip size={12} />
              {announcement.attachments.length} attachment{announcement.attachments.length !== 1 ? "s" : ""}
            </div>
            <div className="grid gap-2">
              {announcement.attachments.map((att) => (
                <a
                  key={att.id}
                  href={`${API_BASE}/courses/announcements/attachments/${att.id}/download`}
                  target="_blank"
                  rel="noreferrer"
                  className="group flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 hover:bg-slate-100 hover:border-slate-300 transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800 truncate group-hover:text-indigo-600 transition-colors">
                      {att.title || att.fileName || 'Attachment'}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {att.type || 'File'}{att.size ? ` · ${formatFileSize(att.size)}` : ''}
                    </p>
                  </div>
                  <Download size={14} className="text-slate-400 group-hover:text-indigo-500 shrink-0" />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Action button */}
        {actionLabel && onAction ? (
          <button
            type="button"
            onClick={onAction}
            className="mt-4 inline-flex items-center rounded-lg bg-indigo-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-indigo-700 transition-colors"
          >
            {actionLabel}
          </button>
        ) : null}
      </div>
    </article>
  );
}
