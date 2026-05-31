import React, { useEffect, useMemo, useState } from "react";
import { Bell, Download, Edit3, Image, Paperclip, Plus, Search, Trash2, X } from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import {
  createGlobalAnnouncement,
  deleteGlobalAnnouncement,
  getAnnouncementAudienceOptions,
  listGlobalAnnouncements,
  markGlobalAnnouncementRead,
  updateGlobalAnnouncement
} from "../../services/announcement.service";
import { API_BASE } from "../../services/api";
import { userHasRole } from "../../utils/roles";

function formatDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

function targetSummary(targets = []) {
  if (!targets.length) return "No audience";
  const departments = targets.filter((target) => target.type === "DEPARTMENT");
  const sections = targets.filter((target) => target.type === "CLASS_GROUP");
  return [
    departments.length ? `${departments.length} department${departments.length !== 1 ? "s" : ""}` : "",
    sections.length ? `${sections.length} section${sections.length !== 1 ? "s" : ""}` : ""
  ].filter(Boolean).join(" and ");
}

function audienceGroups(targets = []) {
  const departments = targets.filter((target) => target.type === "DEPARTMENT");
  const sections = targets.filter((target) => target.type === "CLASS_GROUP");
  return { departments, sections };
}

const emptyForm = {
  title: "",
  body: "",
  departmentIds: [],
  classGroupIds: []
};

function attachmentUrl(attachment, action = "view") {
  return `${API_BASE}/courses/announcements/attachments/${attachment.id}/download?action=${action}`;
}

function isImageAttachment(attachment) {
  const type = String(attachment?.type || attachment?.mimeType || "").toLowerCase();
  const title = String(attachment?.title || attachment?.fileName || "").toLowerCase();
  return type.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/.test(title);
}

function formatFileSize(size) {
  const value = Number(size);
  if (!Number.isFinite(value) || value <= 0) return "";
  if (value >= 1024 * 1024) return `${(value / (1024 * 1024)).toFixed(1)} MB`;
  if (value >= 1024) return `${Math.round(value / 1024)} KB`;
  return `${value} B`;
}

function authorInitials(name) {
  const parts = String(name || "U").trim().split(/\s+/).filter(Boolean);
  if (!parts.length) return "U";
  return parts.slice(0, 2).map((part) => part[0]?.toUpperCase() || "").join("");
}

function AuthorAvatar({ userId, name }) {
  const [imageFailed, setImageFailed] = useState(false);
  const src = userId && !imageFailed ? `${API_BASE}/profile/photo/${userId}` : null;

  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-indigo-600 text-sm font-extrabold text-white">
      {src ? (
        <img
          src={src}
          alt={name || "Author"}
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        authorInitials(name)
      )}
    </span>
  );
}

function AttachmentStrip({ attachments = [] }) {
  if (!attachments.length) return null;
  const images = attachments.filter(isImageAttachment);
  const files = attachments.filter((attachment) => !isImageAttachment(attachment));

  return (
    <div className="mt-4 space-y-3">
      {images.length ? (
        <div className="grid grid-cols-1 gap-3">
          {images.slice(0, 4).map((attachment) => (
            <a
              key={attachment.id}
              href={attachmentUrl(attachment)}
              target="_blank"
              rel="noreferrer"
              className="group block overflow-hidden rounded-xl border border-slate-200 bg-slate-100"
            >
              <img
                src={attachmentUrl(attachment)}
                alt={attachment.title || "Announcement image"}
                className="h-auto max-h-[70vh] w-full object-contain transition-transform group-hover:scale-[1.005]"
              />
            </a>
          ))}
        </div>
      ) : null}
      {files.length ? (
        <div className="grid gap-2 sm:grid-cols-2">
          {files.map((attachment) => (
            <a
              key={attachment.id}
              href={attachmentUrl(attachment, "download")}
              className="flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm hover:border-indigo-200 hover:bg-indigo-50"
            >
              <Paperclip size={16} className="shrink-0 text-indigo-500" />
              <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{attachment.title || "Attachment"}</span>
              <span className="shrink-0 text-xs text-slate-400">{formatFileSize(attachment.size)}</span>
              <Download size={15} className="shrink-0 text-slate-400" />
            </a>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function AudienceFooter({ targets = [] }) {
  const { departments, sections } = audienceGroups(targets);
  if (!departments.length && !sections.length) return null;

  return (
    <div className="mt-4 border-t border-slate-100 pt-3 text-xs text-slate-500">
      {departments.length ? (
        <p>
          <span className="font-bold text-slate-600">Departments:</span>{" "}
          {departments.map((target) => target.label || target.value).join(", ")}
        </p>
      ) : null}
      {sections.length ? (
        <p className={departments.length ? "mt-1" : ""}>
          <span className="font-bold text-slate-600">Sections:</span>{" "}
          {sections.map((target) => target.label || target.value).join(", ")}
        </p>
      ) : null}
    </div>
  );
}

function StagedAttachmentPreview({ files = [], onRemove }) {
  if (!files.length) return null;
  const imageFiles = files.filter((item) => item.previewUrl);
  const otherFiles = files.filter((item) => !item.previewUrl);

  return (
    <div className="mt-3 space-y-3">
      {imageFiles.map((item) => (
        <div key={item.id} className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <img src={item.previewUrl} alt="" className="h-auto max-h-96 w-full object-contain" />
          <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-3 py-2">
            <span className="min-w-0 truncate text-sm font-semibold text-slate-700">{item.name}</span>
            <button type="button" className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => onRemove(item.id)} aria-label="Remove file">
              <X size={14} />
            </button>
          </div>
        </div>
      ))}
      {otherFiles.length ? (
        <div className="grid gap-2">
          {otherFiles.map((item) => (
            <div key={item.id} className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white p-2 text-sm">
              <Paperclip size={16} className="text-slate-400" />
              <span className="min-w-0 flex-1 truncate font-semibold text-slate-700">{item.name}</span>
              <button type="button" className="rounded-md p-1 text-slate-400 hover:bg-red-50 hover:text-red-600" onClick={() => onRemove(item.id)} aria-label="Remove file">
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function ToggleList({ title, items, selectedIds, onToggle, disabled = false, lockedIds = [] }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
      <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-2">{title}</p>
      {items.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-44 overflow-y-auto pr-1">
          {items.map((item) => {
            const checked = selectedIds.includes(item.id);
            const locked = lockedIds.includes(item.id);
            return (
              <label
                key={item.id}
                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${checked ? "border-indigo-300 bg-white text-indigo-700" : "border-slate-200 bg-white text-slate-600"} ${disabled ? "opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  disabled={disabled || locked}
                  onChange={() => onToggle(item.id)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                />
                <span className="min-w-0 truncate">
                  <strong>{item.code}</strong>{item.name ? ` - ${item.name}` : ""}
                </span>
              </label>
            );
          })}
        </div>
      ) : (
        <p className="text-sm text-slate-500">No available options.</p>
      )}
    </div>
  );
}

function AnnouncementModal({ mode, form, setForm, files, setFiles, existingAttachments, options, onClose, onSubmit, saving, canUseDepartments, isCoordinator }) {
  function toggleArray(field, id) {
    setForm((previous) => {
      const selected = previous[field].includes(id);
      return {
        ...previous,
        [field]: selected ? previous[field].filter((item) => item !== id) : [...previous[field], id]
      };
    });
  }

  function removeStagedFile(fileId) {
    setFiles((previous) => {
      const removed = previous.find((fileItem) => fileItem.id === fileId);
      if (removed?.previewUrl) URL.revokeObjectURL(removed.previewUrl);
      return previous.filter((fileItem) => fileItem.id !== fileId);
    });
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white shadow-2xl" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-slate-200 p-5">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-widest text-slate-400">Global announcements</p>
            <h2 className="font-heading text-lg font-extrabold text-slate-900">{mode === "edit" ? "Edit Announcement" : "Create Announcement"}</h2>
          </div>
          <button type="button" className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700" onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>

        <form className="flex flex-col gap-4 p-5" onSubmit={onSubmit}>
          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
            Title
            <input
              value={form.title}
              onChange={(event) => setForm((previous) => ({ ...previous, title: event.target.value }))}
              required
              className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>

          <label className="flex flex-col gap-1.5 text-sm font-semibold text-slate-700">
            Content
            <textarea
              rows={6}
              value={form.body}
              onChange={(event) => setForm((previous) => ({ ...previous, body: event.target.value }))}
              required
              className="resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
            />
          </label>

          <div className="grid gap-4">
            {canUseDepartments ? (
              <ToggleList
                title="Departments"
                items={options.departments || []}
                selectedIds={form.departmentIds}
                onToggle={(id) => toggleArray("departmentIds", id)}
              />
            ) : null}
            <ToggleList
              title={isCoordinator ? "Your Sections" : "Sections"}
              items={options.classGroups || []}
              selectedIds={form.classGroupIds}
              onToggle={(id) => toggleArray("classGroupIds", id)}
              lockedIds={isCoordinator && (options.classGroups || []).length === 1 ? [options.classGroups[0].id] : []}
            />
          </div>
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 p-4">
            <label className="flex cursor-pointer items-center justify-center gap-2 rounded-lg bg-white px-4 py-3 text-sm font-semibold text-slate-600 shadow-sm hover:text-indigo-600">
              <Image size={16} />
              Add files or images
              <input
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  const picked = Array.from(event.target.files || []).map((file) => ({
                    id: `${file.name}-${file.size}-${file.lastModified}-${globalThis.crypto?.randomUUID?.() || Date.now()}`,
                    file,
                    name: file.name,
                    size: file.size,
                    type: file.type,
                    previewUrl: file.type.startsWith("image/") ? URL.createObjectURL(file) : null
                  }));
                  setFiles((previous) => [...previous, ...picked]);
                  event.target.value = "";
                }}
              />
            </label>
            {existingAttachments?.length ? (
              <div className="mt-4">
                <p className="mb-2 text-xs font-bold uppercase tracking-widest text-slate-400">Current attachments</p>
                <AttachmentStrip attachments={existingAttachments} />
              </div>
            ) : null}
            <StagedAttachmentPreview files={files} onRemove={removeStagedFile} />
          </div>

          <div className="flex flex-col-reverse gap-2 border-t border-slate-100 pt-4 sm:flex-row sm:justify-end">
            <button type="button" className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50" onClick={onClose} disabled={saving}>
              Cancel
            </button>
            <button type="submit" className="rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60" disabled={saving}>
              {saving ? "Saving..." : mode === "edit" ? "Save changes" : "Publish"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function GlobalAnnouncementsPage() {
  const { user, selectedRole } = useAuth();
  const toast = useToast();
  const [announcements, setAnnouncements] = useState([]);
  const [options, setOptions] = useState({ canCreate: false, departments: [], classGroups: [] });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");
  const [modalMode, setModalMode] = useState(null);
  const [editingAnnouncement, setEditingAnnouncement] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState([]);

  const currentUserId = user?.id || selectedRole?.userId || null;
  const isAdmin = userHasRole(user, "ADMIN");
  const isCoordinator = !isAdmin && userHasRole(user, "COORDINATOR");
  const canCreate = options.canCreate && (isAdmin || isCoordinator || ["ADMIN", "COORDINATOR"].includes(selectedRole?.value));
  const canUseDepartments = isAdmin;
  const singleCoordinatorSectionId = isCoordinator && options.classGroups?.length === 1
    ? options.classGroups[0].id
    : null;

  async function loadData() {
    setLoading(true);
    try {
      const [listPayload, optionPayload] = await Promise.all([
        listGlobalAnnouncements(selectedRole),
        getAnnouncementAudienceOptions(selectedRole)
      ]);
      setAnnouncements(Array.isArray(listPayload.items) ? listPayload.items : []);
      setOptions(optionPayload || { canCreate: false, departments: [], classGroups: [] });
      const unreadIds = (Array.isArray(listPayload.items) ? listPayload.items : [])
        .filter((announcement) => !announcement.read)
        .map((announcement) => announcement.id);
      if (unreadIds.length) {
        setAnnouncements((previous) => previous.map((announcement) => ({ ...announcement, read: true })));
        Promise.all(unreadIds.map((id) => markGlobalAnnouncementRead(selectedRole, id))).catch(() => {});
      }
    } catch (error) {
      toast.error(error.message || "Failed to load announcements.", "Announcements");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, [selectedRole]);

  const filteredAnnouncements = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return announcements;
    return announcements.filter((item) =>
      [item.title, item.body, item.authorName, targetSummary(item.targets)]
        .join(" ")
        .toLowerCase()
        .includes(needle)
    );
  }, [announcements, query]);

  function openCreate() {
    setEditingAnnouncement(null);
    setForm({
      ...emptyForm,
      classGroupIds: singleCoordinatorSectionId ? [singleCoordinatorSectionId] : []
    });
    setFiles([]);
    setModalMode("create");
  }

  function openEdit(announcement) {
    setEditingAnnouncement(announcement);
    setForm({
      title: announcement.title || "",
      body: announcement.body || "",
      departmentIds: canUseDepartments
        ? (announcement.targets || []).filter((target) => target.type === "DEPARTMENT").map((target) => target.value)
        : [],
      classGroupIds: singleCoordinatorSectionId
        ? [singleCoordinatorSectionId]
        : (announcement.targets || []).filter((target) => target.type === "CLASS_GROUP").map((target) => target.value)
    });
    setFiles([]);
    setModalMode("edit");
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = {
        ...form,
        departmentIds: canUseDepartments ? form.departmentIds : [],
        classGroupIds: form.classGroupIds
      };
      if (modalMode === "edit" && editingAnnouncement) {
        await updateGlobalAnnouncement(selectedRole, editingAnnouncement.id, payload, files);
        toast.success("Announcement updated.", "Announcements");
      } else {
        await createGlobalAnnouncement(selectedRole, payload, files);
        toast.success("Announcement published.", "Announcements");
      }
      setModalMode(null);
      setEditingAnnouncement(null);
      setFiles([]);
      await loadData();
    } catch (error) {
      toast.error(error.message || "Could not save announcement.", "Announcements");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(announcement) {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await deleteGlobalAnnouncement(selectedRole, announcement.id);
      toast.success("Announcement deleted.", "Announcements");
      await loadData();
    } catch (error) {
      toast.error(error.message || "Could not delete announcement.", "Announcements");
    }
  }

  function canManage(announcement) {
    return isAdmin || String(announcement.createdBy) === String(currentUserId);
  }

  return (
    <div className="mx-auto flex w-full min-w-0 max-w-[920px] flex-col gap-6 pb-8 lg:w-5/6">
      <section className="relative overflow-hidden rounded-2xl p-6 sm:p-8" style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e3a5f 60%, #0f172a 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 75% 45%, rgba(99,102,241,0.18) 0%, transparent 70%)" }} />
        <div className="relative z-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-[0.72rem] font-bold uppercase tracking-widest text-white/50">Faculty-wide updates</p>
            <h1 className="font-heading text-2xl md:text-3xl font-extrabold text-white leading-tight">Global Announcements</h1>
            <p className="mt-1 text-sm text-white/60">Institutional messages filtered to your department and section.</p>
          </div>
          {canCreate ? (
            <button type="button" onClick={openCreate} className="inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-slate-900 hover:bg-slate-100">
              <Plus size={16} /> New announcement
            </button>
          ) : null}
        </div>
      </section>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-[0.7rem] font-bold uppercase tracking-widest text-slate-400">Inbox</p>
          <h2 className="font-heading text-base font-extrabold text-slate-900">{filteredAnnouncements.length} announcement{filteredAnnouncements.length !== 1 ? "s" : ""}</h2>
        </div>
        <label className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search announcements"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
          />
        </label>
      </div>

      {loading ? (
        <div className="grid gap-3">
          {[1, 2, 3].map((item) => <div key={item} className="h-36 rounded-xl bg-slate-100 animate-pulse" />)}
        </div>
      ) : filteredAnnouncements.length ? (
        <div className="flex w-full flex-col gap-3">
          {filteredAnnouncements.map((announcement) => (
            <article key={announcement.id} className={`w-full rounded-xl border bg-white p-4 shadow-sm transition-all hover:shadow-md ${announcement.read ? "border-slate-200" : "border-indigo-200 ring-1 ring-indigo-100"}`}>
              <div className="flex flex-col gap-4">
                <div className="min-w-0 w-full">
                  <div className="mb-3 flex items-center gap-3">
                    <AuthorAvatar userId={announcement.authorId || announcement.createdBy} name={announcement.authorName} />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-extrabold text-slate-900">{announcement.authorName || "Unknown author"}</p>
                      <p className="text-xs font-semibold text-slate-400">{formatDate(announcement.createdAt)}</p>
                    </div>
                    {!announcement.read ? <span className="ml-auto rounded-full bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-600">Unread</span> : null}
                  </div>
                  <h3 className="font-heading text-lg font-extrabold leading-tight text-slate-900">{announcement.title}</h3>
                  <p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-slate-600">{announcement.body}</p>
                  <AttachmentStrip attachments={announcement.attachments || []} />
                  <AudienceFooter targets={announcement.targets || []} />
                </div>
                <div className="flex shrink-0 flex-wrap justify-end gap-2">
                  {canManage(announcement) ? (
                    <>
                      <button type="button" onClick={() => openEdit(announcement)} className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-50">
                        <Edit3 size={14} /> Edit
                      </button>
                      <button type="button" onClick={() => handleDelete(announcement)} className="inline-flex items-center gap-1.5 rounded-lg border border-red-100 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50">
                        <Trash2 size={14} /> Delete
                      </button>
                    </>
                  ) : null}
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center">
          <Bell size={30} className="mx-auto mb-3 text-slate-300" />
          <p className="text-sm font-semibold text-slate-700">No global announcements found.</p>
          <p className="mt-1 text-sm text-slate-400">Relevant faculty updates will appear here.</p>
        </div>
      )}

      {modalMode ? (
        <AnnouncementModal
          mode={modalMode}
          form={form}
          setForm={setForm}
          files={files}
          setFiles={setFiles}
          existingAttachments={editingAnnouncement?.attachments || []}
          options={options}
          onClose={() => setModalMode(null)}
          onSubmit={handleSubmit}
          saving={saving}
          canUseDepartments={canUseDepartments}
          isCoordinator={isCoordinator}
        />
      ) : null}

    </div>
  );
}
