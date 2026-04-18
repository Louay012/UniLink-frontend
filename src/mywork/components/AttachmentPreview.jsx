import { getAttachmentKind } from "../helpers";

const iconByKind = {
  pdf: "📄",
  image: "🖼️",
  video: "🎬",
  file: "📎"
};

export default function AttachmentPreview({ attachment }) {
  const kind = getAttachmentKind(attachment);

  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs text-slate-700">
      <span>{iconByKind[kind]}</span>
      <span className="font-medium">{attachment.name}</span>
      {attachment.size ? <span className="text-slate-400">({attachment.size})</span> : null}
    </div>
  );
}
