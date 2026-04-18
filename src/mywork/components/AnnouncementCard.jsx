import { formatDate } from "../../mockData";
import AttachmentPreview from "./AttachmentPreview";

function badgeClassByType(type) {
  if (type === "PINNED") return "bg-amber-100 text-amber-800 border border-amber-200";
  if (type === "URGENT") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

export default function AnnouncementCard({ announcement, showCourse = false, actionLabel, onAction }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow">
      <div className="flex flex-wrap items-center gap-2 mb-2">
        {announcement.visualType === "PINNED" ? <span title="Pinned">📌</span> : null}
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${badgeClassByType(announcement.visualType)}`}>
          {announcement.visualType}
        </span>
        {showCourse ? (
          <span className="text-xs px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
            {announcement.courseTitle}
          </span>
        ) : null}
      </div>

      <h3 className="text-lg font-semibold text-slate-900">{announcement.title}</h3>
      <p className="mt-2 text-slate-700 line-clamp-3">{announcement.content}</p>

      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-slate-500">
        <span>By {announcement.author || "Teacher"}</span>
        <span>{formatDate(announcement.timestamp)}</span>
      </div>

      {announcement.attachments?.length ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {announcement.attachments.map((attachment) => (
            <AttachmentPreview key={attachment.id} attachment={attachment} />
          ))}
        </div>
      ) : null}

      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-4 inline-flex items-center rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-white hover:bg-opacity-90"
        >
          {actionLabel}
        </button>
      ) : null}
    </article>
  );
}
