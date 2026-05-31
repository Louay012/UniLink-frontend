import React, { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  User, Mail, GraduationCap, Building2, Layers, BookOpen,
  Hash, CalendarDays, Shield, Camera, Lock, Eye, EyeOff,
  CheckCircle2, AlertCircle, Briefcase, MapPin, Clock, X,
  Phone, Pencil
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../../context/ToastContext";
import { API_BASE, apiRequest } from "../../services/api";
import { notifyAvatarUpdated } from "../../components/NavAvatar";

const photoUrl = (userId) => `${API_BASE}/profile/photo/${userId}`;

// ── Reusable info row ─────────────────────────────────────────────────
function InfoRow({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Icon size={15} className="flex-shrink-0 text-indigo-400 mt-0.5" />
      <div className="min-w-0 flex-1 flex items-baseline justify-between gap-4">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
          {label}
        </span>
        <span className="text-sm font-semibold text-slate-800 text-right">{value}</span>
      </div>
    </div>
  );
}

// ── Section divider inside the unified card ───────────────────────────
function PhoneEditRow({ value, editing, draft, saving, onDraftChange, onEdit, onCancel, onSave }) {
  return (
    <div className="flex items-start gap-3 py-3 border-b border-slate-100 last:border-0">
      <Phone size={15} className="flex-shrink-0 text-indigo-400 mt-0.5" />
      <div className="min-w-0 flex-1 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <span className="text-xs font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">
          Phone
        </span>

        {editing ? (
          <div className="flex w-full flex-col gap-2 sm:max-w-sm sm:flex-row">
            <input
              type="tel"
              value={draft}
              onChange={(event) => onDraftChange(event.target.value)}
              disabled={saving}
              placeholder="Add phone number"
              className="min-w-0 flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-800 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 disabled:opacity-60"
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={onCancel}
                disabled={saving}
                title="Cancel"
                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 disabled:opacity-50"
              >
                <X size={14} />
              </button>
              <button
                type="button"
                onClick={onSave}
                disabled={saving}
                title="Save phone"
                className="h-9 w-9 inline-flex items-center justify-center rounded-xl border border-indigo-500 bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                <CheckCircle2 size={15} />
              </button>
            </div>
          </div>
        ) : (
          <div className="flex min-w-0 items-center justify-end gap-2">
            <span className={`truncate text-sm font-semibold ${value ? "text-slate-800" : "text-slate-400"}`}>
              {value || "No phone number"}
            </span>
            <button
              type="button"
              onClick={onEdit}
              title={value ? "Edit phone" : "Add phone"}
              className="h-8 w-8 inline-flex flex-shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600"
            >
              <Pencil size={13} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function SectionHeading({ title }) {
  return (
    <div className="flex items-center gap-3 pt-4 pb-1">
      <span className="text-[0.7rem] font-extrabold uppercase tracking-[0.14em] text-indigo-500">
        {title}
      </span>
      <div className="flex-1 h-px bg-indigo-100" />
    </div>
  );
}

// ── Change Password Modal ─────────────────────────────────────────────
function ChangePasswordModal({ token, onClose }) {
  const toast = useToast();
  const [pwCurrent, setPwCurrent] = useState("");
  const [pwNew, setPwNew]         = useState("");
  const [pwConfirm, setPwConfirm] = useState("");
  const [showCur, setShowCur]     = useState(false);
  const [showNew, setShowNew]     = useState(false);
  const [showCon, setShowCon]     = useState(false);
  const [loading, setLoading]     = useState(false);
  // Inline validation errors only (before the API call)
  const [validationError, setValidationError] = useState("");

  // Close on Escape key
  useEffect(() => {
    const handleKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setValidationError("");

    if (pwNew.length < 8) { setValidationError("New password must be at least 8 characters."); return; }
    if (pwNew !== pwConfirm) { setValidationError("Passwords do not match."); return; }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/profile/password`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: pwCurrent, newPassword: pwNew }),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(body.message || "Could not update password.");

      // ✅ Success toast, then close modal
      toast.success("Your password has been updated.", "Password Changed");
      onClose();
    } catch (err) {
      // ❌ Error toast for API/network errors
      toast.error(err.message || "Could not update password.", "Password Update Failed");
    } finally {
      setLoading(false);
    }
  }

  const fields = [
    { label: "Current Password", value: pwCurrent, set: setPwCurrent, show: showCur, toggle: () => setShowCur(v => !v) },
    { label: "New Password",     value: pwNew,     set: setPwNew,     show: showNew, toggle: () => setShowNew(v => !v) },
    { label: "Confirm Password", value: pwConfirm, set: setPwConfirm, show: showCon, toggle: () => setShowCon(v => !v) },
  ];

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      style={{ background: "rgba(2,6,23,0.55)", backdropFilter: "blur(6px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        style={{ animation: "rise-in 200ms ease" }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Lock size={16} className="text-indigo-500" />
            <h2 className="text-base font-extrabold text-slate-800 m-0">Change Password</h2>
          </div>
          <button
            type="button" onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors border-none bg-transparent cursor-pointer"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 flex flex-col gap-4">
          {fields.map(({ label, value, set, show, toggle }) => (
            <div key={label}>
              <label className="block text-xs font-bold text-slate-500 mb-1.5">{label}</label>
              <div className="relative">
                <input
                  type={show ? "text" : "password"}
                  value={value}
                  onChange={e => set(e.target.value)}
                  required
                  disabled={loading}
                  placeholder={label}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2.5 text-sm pr-10 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all disabled:opacity-60"
                />
                <button
                  type="button" onClick={toggle} tabIndex={-1}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 border-none bg-transparent cursor-pointer p-0 transition-colors"
                >
                  {show ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>
          ))}

          <p className="text-xs text-slate-400 m-0">At least 8 characters required.</p>

          {/* Only show inline validation errors (mismatch, too short) — API errors go to toast */}
          {validationError && (
            <div className="flex items-center gap-2 text-red-600 text-xs font-semibold bg-red-50 border border-red-100 rounded-xl px-3 py-2.5">
              <AlertCircle size={13} className="flex-shrink-0" /> {validationError}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button
              type="button" onClick={onClose}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors border-none cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || !pwCurrent || !pwNew || !pwConfirm}
              className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed border-none cursor-pointer"
              style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
            >
              {loading ? "Updating…" : "Update Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Skeleton loading ──────────────────────────────────────────────────
function ProfileSkeleton() {
  return (
    <div className="page-shell" style={{ maxWidth: 960, width: "100%", margin: "0 auto", paddingTop: "1.5rem" }}>
      {/* Hero skeleton */}
      <div className="rounded-2xl p-6 mb-5 flex flex-col sm:flex-row items-center gap-5 animate-pulse"
        style={{ background: "linear-gradient(135deg,#0b1220 0%,#1e293b 85%)" }}>
        <div className="w-20 h-20 rounded-full bg-white/10 flex-shrink-0" />
        <div className="flex-1 space-y-3 min-w-0 w-full sm:w-auto">
          <div className="h-5 bg-white/10 rounded-lg w-48" />
          <div className="h-3 bg-white/10 rounded-lg w-36" />
          <div className="h-3 bg-white/10 rounded-lg w-44" />
        </div>
        <div className="h-9 w-36 bg-white/10 rounded-xl flex-shrink-0" />
      </div>
      {/* Card skeleton */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4 space-y-5">
        <div className="h-3 bg-slate-100 rounded w-40" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 animate-pulse">
            <div className="h-3 bg-slate-100 rounded w-28" />
            <div className="h-3 bg-slate-100 rounded w-44" />
          </div>
        ))}
        <div className="h-3 bg-slate-100 rounded w-32 mt-4" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="flex justify-between items-center py-3 border-b border-slate-50 animate-pulse">
            <div className="h-3 bg-slate-100 rounded w-32" />
            <div className="h-3 bg-slate-100 rounded w-40" />
          </div>
        ))}
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────
export default function ProfilePage() {
  const { token, selectedRole } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profile, setProfile]               = useState(null);
  const [loading, setLoading]               = useState(true);
  const [photoSrc, setPhotoSrc]             = useState(null);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [pwModalOpen, setPwModalOpen]       = useState(false);
  const [phoneEditing, setPhoneEditing]     = useState(false);
  const [phoneDraft, setPhoneDraft]         = useState("");
  const [phoneSaving, setPhoneSaving]       = useState(false);

  // Photo preview state (two-step: select → preview → save)
  const [pendingFile, setPendingFile]       = useState(null);
  const [previewSrc, setPreviewSrc]         = useState(null);

  useEffect(() => {
    if (!token) navigate("/login", { replace: true });
  }, [token, navigate]);

  useEffect(() => {
    let active = true;
    async function loadProfile() {
      setLoading(true);
      try {
        const data = await apiRequest("/profile", selectedRole);
        if (active) {
          setProfile(data);
          setPhotoSrc(`${photoUrl(data.id)}?t=${Date.now()}`);
        }
      } catch (err) {
        if (active) toast.error(err.message || "Could not load profile.", "Profile Error");
      } finally {
        if (active) setLoading(false);
      }
    }
    loadProfile();
    return () => { active = false; };
  }, [selectedRole?.value]);

  // Step 1: pick file → preview
  function handleFileSelect(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.warning("Please select an image file (JPG, PNG, WEBP…).", "Invalid File");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast.warning("Image must be under 5 MB.", "File Too Large");
      return;
    }
    setPendingFile(file);
    setPreviewSrc(URL.createObjectURL(file));
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  // Step 2: save preview
  async function handlePhotoSave() {
    if (!pendingFile) return;
    setPhotoUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", pendingFile);
      const res = await fetch(`${API_BASE}/profile/photo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || "Upload failed."); }
      setPhotoSrc(`${photoUrl(profile.id)}?t=${Date.now()}`);
      toast.success("Your profile photo has been updated.", "Photo Updated");
      notifyAvatarUpdated();
    } catch (err) {
      toast.error(err.message || "Upload failed.", "Photo Upload Failed");
    } finally {
      setPhotoUploading(false);
      handlePhotoCancel();
    }
  }

  // Cancel preview
  function handlePhotoCancel() {
    if (previewSrc) URL.revokeObjectURL(previewSrc);
    setPendingFile(null);
    setPreviewSrc(null);
  }

  // Remove photo
  async function handlePhotoRemove() {
    setPhotoUploading(true);
    try {
      const res = await fetch(`${API_BASE}/profile/photo`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) { const b = await res.json().catch(() => ({})); throw new Error(b.message || "Could not remove photo."); }
      setPhotoSrc(null);
      toast.success("Profile photo removed.", "Photo Removed");
      notifyAvatarUpdated();
    } catch (err) {
      toast.error(err.message || "Could not remove photo.", "Remove Failed");
    } finally {
      setPhotoUploading(false);
    }
  }

  // ── Loading → skeleton ──────────────────────────────────────────────
  function handlePhoneEdit() {
    setPhoneDraft(profile?.phone || "");
    setPhoneEditing(true);
  }

  function handlePhoneCancel() {
    setPhoneDraft(profile?.phone || "");
    setPhoneEditing(false);
  }

  async function handlePhoneSave() {
    setPhoneSaving(true);
    try {
      const payload = await apiRequest("/profile/phone", selectedRole, {
        method: "PATCH",
        body: JSON.stringify({ phone: phoneDraft }),
      });
      setProfile((current) => current ? { ...current, phone: payload.phone || "" } : current);
      setPhoneDraft(payload.phone || "");
      setPhoneEditing(false);
      toast.success("Your phone number has been updated.", "Phone Updated");
    } catch (err) {
      toast.error(err.message || "Could not update phone number.", "Phone Update Failed");
    } finally {
      setPhoneSaving(false);
    }
  }

  if (loading) return <ProfileSkeleton />;

  if (!profile) {
    return (
      <div className="page-shell">
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mt-4">
          Profile not available.
        </div>
      </div>
    );
  }

  const fullName       = `${profile.firstName || ""} ${profile.lastName || ""}`.trim() || "User";
  const initials       = fullName.split(" ").filter(Boolean).slice(0, 2).map(w => w[0]?.toUpperCase()).join("") || "U";
  const sp             = profile.studentProfile;
  const tp             = profile.teacherProfile;
  const cp             = profile.coordinatorProfile;
  const roleLabels     = (profile.roles || []).map(r => r.label).join(", ") || "User";
  const academicSummary = sp ? [sp.classGroup?.code, sp.level?.code].filter(Boolean).join(" · ") : "";
  const joinDate       = new Date(profile.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  const tpHireDate     = tp && tp.hireDate ? new Date(tp.hireDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : null;

  // Whether the user has a server-side photo loaded (not just a preview)
  const hasServerPhoto = !!photoSrc;

  return (
    <>
      {pwModalOpen && (
        <ChangePasswordModal token={token} onClose={() => setPwModalOpen(false)} />
      )}

      <div className="page-shell profile-enter" style={{ maxWidth: 960, width: "100%", margin: "0 auto", paddingTop: "1.5rem" }}>

        {/* ── Hero ──────────────────────────────────────────────────── */}
        <div
          className="rounded-2xl p-6 mb-5 flex flex-col sm:flex-row items-center gap-5"
          style={{ background: "linear-gradient(135deg,#0b1220 0%,#1e293b 85%)", color: "#f1f5f9" }}
        >
          {/* Avatar with camera/remove overlay + preview save/cancel */}
          <div className="flex flex-col items-center flex-shrink-0 gap-2">
            <div className="relative group">
              <div
                className="w-20 h-20 rounded-full overflow-hidden flex items-center justify-center text-2xl font-extrabold text-white"
                style={{
                  background: "linear-gradient(135deg,#6366f1,#8b5cf6)",
                  boxShadow: previewSrc ? "0 0 0 3px #6366f1, 0 0 0 5px rgba(99,102,241,0.3)" : "none",
                }}
              >
                {previewSrc ? (
                  <img src={previewSrc} alt="Preview" className="w-full h-full object-cover" />
                ) : photoSrc ? (
                  <img src={photoSrc} alt={fullName} className="w-full h-full object-cover"
                    onError={() => setPhotoSrc(null)} />
                ) : initials}
              </div>

              {/* Overlays — only when NOT in preview mode */}
              {!previewSrc && (
                <>
                  {/* Camera overlay (upload) */}
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={photoUploading}
                    title="Change photo"
                    className="absolute inset-0 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-0"
                    style={{ background: "rgba(0,0,0,0.45)" }}
                  >
                    {photoUploading
                      ? <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Camera size={20} className="text-white" />}
                  </button>

                  {/* Remove photo button — only if a server photo exists */}
                  {hasServerPhoto && !photoUploading && (
                    <button
                      type="button"
                      onClick={handlePhotoRemove}
                      title="Remove photo"
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border-2 border-white"
                      style={{ background: "#ef4444", fontSize: 12, lineHeight: 1 }}
                    >
                      <X size={12} />
                    </button>
                  )}
                </>
              )}
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
            </div>

            {/* Save / Cancel — only during preview */}
            {previewSrc && (
              <div className="flex gap-2">
                <button
                  type="button" onClick={handlePhotoCancel} disabled={photoUploading}
                  className="px-2.5 py-1 rounded-lg text-[0.7rem] font-bold text-slate-300 bg-white/10 hover:bg-white/20 border-none cursor-pointer transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="button" onClick={handlePhotoSave} disabled={photoUploading}
                  className="px-2.5 py-1 rounded-lg text-[0.7rem] font-bold text-white border-none cursor-pointer transition-colors disabled:opacity-50"
                  style={{ background: "linear-gradient(135deg,#6366f1,#8b5cf6)" }}
                >
                  {photoUploading ? "Saving…" : "Save"}
                </button>
              </div>
            )}
          </div>

          {/* Name + summary */}
          <div className="min-w-0 flex-1 text-center sm:text-left">
            <h1 className="text-xl font-extrabold text-white m-0 leading-tight">{fullName}</h1>
            <p className="text-slate-300 text-sm mt-0.5 m-0">
              {roleLabels}{academicSummary ? ` · ${academicSummary}` : ""}
            </p>
            <p className="text-slate-400 text-xs mt-1 m-0">Member since {joinDate}</p>
          </div>

          {/* Change Password button */}
          <button
            type="button"
            onClick={() => setPwModalOpen(true)}
            className="flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer border-none"
            style={{ background: "rgba(255,255,255,0.12)", color: "#e2e8f0" }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.2)"}
            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.12)"}
          >
            <Lock size={14} />
            <span>Change Password</span>
          </button>
        </div>

        {/* ── Single Unified Info Card ───────────────────────────────── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm px-6 py-4">

          <SectionHeading title="Personal Information" />
          <InfoRow icon={User}         label="Full Name"    value={fullName} />
          <InfoRow icon={Mail}         label="Email"        value={profile.email} />
          <PhoneEditRow
            value={profile.phone}
            editing={phoneEditing}
            draft={phoneDraft}
            saving={phoneSaving}
            onDraftChange={setPhoneDraft}
            onEdit={handlePhoneEdit}
            onCancel={handlePhoneCancel}
            onSave={handlePhoneSave}
          />
          <InfoRow icon={Shield}       label="Roles"        value={roleLabels} />
          <InfoRow icon={CalendarDays} label="Member Since" value={joinDate} />

          {sp && (
            <>
              <SectionHeading title="Academic Info" />
              <InfoRow icon={Hash}          label="Student Number" value={sp.studentNumber} />
              <InfoRow icon={Building2}     label="Class Group"
                value={sp.classGroup ? `${sp.classGroup.name} (${sp.classGroup.code})` : null} />
              <InfoRow icon={Layers}        label="Department"
                value={sp.department ? `${sp.department.name} (${sp.department.code})` : null} />
              <InfoRow icon={GraduationCap} label="Level"
                value={sp.level ? `${sp.level.name} (${sp.level.code})` : null} />
              <InfoRow icon={Shield}        label="Enrollment"     value={sp.enrollmentStatus} />
              <InfoRow icon={BookOpen}      label="Program"        value={sp.programName} />
            </>
          )}

          {tp && (
            <>
              <SectionHeading title="Teacher Info" />
              <InfoRow icon={Briefcase} label="Professional Grade" value={tp.professionalGrade} />
              <InfoRow icon={Shield} label="Employment Status" value={tp.employmentStatus} />
              <InfoRow icon={CalendarDays} label="Hire Date" value={tpHireDate} />
              <InfoRow icon={Hash}      label="Employee Code" value={tp.employeeCode} />
              <InfoRow icon={Briefcase} label="Academic Rank" value={tp.academicRank} />
              <InfoRow icon={MapPin}    label="Office"        value={tp.officeLocation} />
              <InfoRow icon={Clock}     label="Office Hours"  value={tp.officeHours} />
              <InfoRow icon={User}      label="Bio"           value={tp.bio} />
            </>
          )}

          {cp && cp.supervisedGroups && cp.supervisedGroups.length > 0 && (
            <>
              <SectionHeading title="Coordinator" />
              {cp.supervisedGroups.map((g) => (
                <InfoRow key={g.id} icon={Building2} label="Supervised Group" value={`${g.name} (${g.code})`} />
              ))}
            </>
          )}

        </div>
      </div>
    </>
  );
}
