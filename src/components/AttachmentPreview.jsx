import { Download } from "lucide-react";
import { API_BASE } from "../services/api";

function getAttachmentKind(att) {
  const mime = String(att?.type || att?.mimeType || '').toLowerCase();
  if (mime.includes('pdf')) return 'pdf';
  if (mime.startsWith('image/')) return 'image';
  if (mime.startsWith('video/')) return 'video';
  const ext = String(att?.title || att?.name || att?.fileName || '').split('.').pop()?.toLowerCase();
  if (ext === 'pdf') return 'pdf';
  if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
  if (['mp4', 'mov', 'avi', 'webm'].includes(ext)) return 'video';
  return 'file';
}

const iconByKind = {
  pdf: "📄",
  image: "🖼️",
  video: "🎬",
  file: "📎"
};

const colorByKind = {
  pdf: { bg: "bg-red-50", text: "text-red-600", border: "border-red-200" },
  image: { bg: "bg-emerald-50", text: "text-emerald-600", border: "border-emerald-200" },
  video: { bg: "bg-purple-50", text: "text-purple-600", border: "border-purple-200" },
  file: { bg: "bg-slate-50", text: "text-slate-600", border: "border-slate-200" }
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
  // Use proper download endpoint instead of raw file_url
  const href = attachment.id
    ? `${API_BASE}/courses/announcements/attachments/${attachment.id}/download`
    : (attachment.url || "#");
  const colors = colorByKind[kind] || colorByKind.file;

  return (
    <div
      className={`group rounded-xl border ${colors.border} ${colors.bg} overflow-hidden flex items-center gap-3 min-h-[64px] hover:shadow-md transition-all p-3`}
    >
      {/* Kind icon */}
      <div className={`w-10 h-10 rounded-lg ${colors.bg} grid place-items-center text-lg shrink-0`}>
        {iconByKind[kind] || iconByKind.file}
      </div>

      {/* Info */}
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium text-slate-800 truncate transition-colors">
          {attachment.name || attachment.title || 'Attachment'}
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          {kind.toUpperCase()}{sizeLabel ? ` · ${sizeLabel}` : ""}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {isPreviewable(attachment.name || attachment.title || attachment.fileName) && (
          <a
            href={`${href}?action=view`}
            target="_blank"
            rel="noreferrer"
            title="Open in new tab"
            className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md transition-colors"
          >
            <ExternalLink size={16} />
          </a>
        )}
        <a
          href={`${href}?action=download`}
          download
          title="Download file"
          className="p-1.5 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-md transition-colors"
        >
          <Download size={16} />
        </a>
      </div>
    </div>
  );
}
