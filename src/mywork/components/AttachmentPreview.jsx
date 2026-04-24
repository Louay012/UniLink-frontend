import { getAttachmentKind } from "../helpers";

const iconByKind = {
  pdf: "PDF",
  image: "IMG",
  video: "VID",
  file: "FILE"
};

function formatSize(size) {
  const value = Number(size);
  if (!Number.isFinite(value) || value <= 0) return null;
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

export default function AttachmentPreview({ attachment }) {
  const kind = getAttachmentKind(attachment);
  const sizeLabel = formatSize(attachment.size);
  const href = attachment.url || "#";
  const isImage = kind === "image" && Boolean(attachment.url);

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="group rounded-lg border border-slate-200 bg-slate-50 overflow-hidden flex items-stretch min-h-[72px] hover:border-slate-300 hover:bg-slate-100 transition-colors"
    >
      <div className="w-20 shrink-0 bg-slate-200 text-[11px] font-semibold text-slate-600 grid place-items-center">
        {isImage ? (
          <img
            src={attachment.url}
            alt={attachment.name || "Attachment preview"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <span>{iconByKind[kind] || iconByKind.file}</span>
        )}
      </div>

      <div className="px-3 py-2 min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate">{attachment.name}</p>
        <p className="text-xs text-slate-500 mt-1">{kind.toUpperCase()}{sizeLabel ? ` • ${sizeLabel}` : ""}</p>
      </div>
    </a>
  );
}
