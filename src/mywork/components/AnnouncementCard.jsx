import AttachmentPreview from "./AttachmentPreview";

function formatDate(value) {
  if (!value) return "";
  try {
    return new Date(value).toLocaleString();
  } catch {
    return String(value);
  }
}

function badgeClassByType(type) {
  if (type === "PINNED") return "bg-amber-100 text-amber-800 border border-amber-200";
  if (type === "URGENT") return "bg-red-100 text-red-700 border border-red-200";
  return "bg-slate-100 text-slate-700 border border-slate-200";
}

function authorInitial(author) {
  const name = String(author || "T").trim();
  return name ? name.charAt(0).toUpperCase() : "T";
}

export default function AnnouncementCard({ announcement, showCourse = false, actionLabel, onAction }) {
  return (
    <article className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <header className="px-5 py-4 flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="h-9 w-9 rounded-full bg-lime-600 text-white grid place-items-center text-sm font-semibold shrink-0">
            {authorInitial(announcement.author)}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-slate-900 truncate">{announcement.author || "Teacher"}</p>
            <p className="text-xs text-slate-500">{formatDate(announcement.timestamp)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {announcement.visualType !== "NORMAL" ? (
            <span className={`text-[11px] font-semibold px-2 py-1 rounded-full ${badgeClassByType(announcement.visualType)}`}>
              {announcement.visualType}
            </span>
          ) : null}
          {showCourse ? (
            <span className="text-[11px] px-2 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
              {announcement.courseTitle}
            </span>
          ) : null}
        </div>
      </header>

      <div className="px-5 pb-4">
        <h3 className="text-[15px] font-semibold text-slate-900">{announcement.title}</h3>
        <p className="mt-2 text-slate-700 whitespace-pre-line">{announcement.content}</p>

        {announcement.attachments?.length ? (
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
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
      </div>
    </article>
  );
}
